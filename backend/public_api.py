import re
from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import Response as RawResponse
from pydantic import BaseModel, EmailStr, Field, field_validator

from core import (db, new_id, now_iso, serialize, serialize_many, rate_limiter, client_ip,
                  PUBLISHED, DEFAULT_SETTINGS, ENQUIRER_TYPES)
import os

public_router = APIRouter(prefix="/api", tags=["public"])

PHONE_RE = re.compile(r"^[0-9+\-\s()]{7,20}$")


class EnquiryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    company_name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    city: str = Field(min_length=2, max_length=120)
    enquirer_type: str
    requirement: str | None = Field(default=None, max_length=5000)
    industry_slug: str | None = None
    product_slug: str | None = None
    category_slug: str | None = None
    source_page: str | None = Field(default=None, max_length=200)
    company_website: str | None = None  # honeypot

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: str) -> str:
        if not PHONE_RE.match(v.strip()):
            raise ValueError("Enter a valid phone number")
        return v.strip()

    @field_validator("enquirer_type")
    @classmethod
    def check_type(cls, v: str) -> str:
        if v not in ENQUIRER_TYPES:
            raise ValueError("Select who you are from the available options")
        return v

    @field_validator("source_page")
    @classmethod
    def check_source(cls, v):
        if v and not v.startswith("/"):
            raise ValueError("Invalid source page")
        return v


async def _settings_doc() -> dict:
    doc = await db.site_settings.find_one({"_id": "site"})
    return doc or dict(DEFAULT_SETTINGS)


def _public_settings(doc: dict) -> dict:
    out = serialize(doc)
    out.pop("enquiry_recipients", None)
    return out


@public_router.get("/health")
async def health():
    await db.command("ping")
    return {
        "status": "ok",
        "database": "connected",
        "email_notifications": "not_configured",
        "time": now_iso(),
    }


@public_router.get("/settings")
async def get_settings():
    return _public_settings(await _settings_doc())


@public_router.get("/pages/{slug}")
async def get_page(slug: str):
    page = await db.page_content.find_one({"slug": slug, "status": PUBLISHED})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize(page)


@public_router.get("/categories")
async def list_categories():
    docs = await db.categories.find({"status": PUBLISHED}).sort([("sort_order", 1), ("name", 1)]).to_list(200)
    out = []
    for d in docs:
        item = serialize(d)
        item["product_count"] = await db.products.count_documents({"category_id": d["_id"], "status": PUBLISHED})
        out.append(item)
    return out


@public_router.get("/categories/{slug}")
async def get_category(slug: str):
    cat = await db.categories.find_one({"slug": slug, "status": PUBLISHED})
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    products = await db.products.find({"category_id": cat["_id"], "status": PUBLISHED}) \
        .sort([("sort_order", 1), ("name", 1)]).to_list(200)
    return {"category": serialize(cat), "products": serialize_many(products)}


@public_router.get("/industries")
async def list_industries():
    docs = await db.industries.find({"status": PUBLISHED}).sort([("sort_order", 1), ("name", 1)]).to_list(200)
    return serialize_many(docs)


@public_router.get("/industries/{slug}")
async def get_industry(slug: str):
    ind = await db.industries.find_one({"slug": slug, "status": PUBLISHED})
    if not ind:
        raise HTTPException(status_code=404, detail="Industry not found")
    products = await db.products.find({"industry_ids": ind["_id"], "status": PUBLISHED}) \
        .sort([("sort_order", 1), ("name", 1)]).to_list(100)
    cats = await db.categories.find(
        {"_id": {"$in": ind.get("category_ids", [])}, "status": PUBLISHED}).to_list(50)
    return {"industry": serialize(ind), "products": serialize_many(products), "categories": serialize_many(cats)}


@public_router.get("/directors")
async def list_directors():
    docs = await db.directors.find({"status": PUBLISHED}).sort([("sort_order", 1), ("name", 1)]).to_list(50)
    return serialize_many(docs)


async def _attach_category(items: list) -> list:
    ids = {i.get("category_id") for i in items if i.get("category_id")}
    cats = await db.categories.find({"_id": {"$in": list(ids)}}).to_list(200)
    lookup = {c["_id"]: {"name": c["name"], "slug": c["slug"]} for c in cats}
    for item in items:
        item["category"] = lookup.get(item.get("category_id"))
    return items


@public_router.get("/products")
async def list_products(
    q: str | None = None,
    category: str | None = None,
    industry: str | None = None,
    featured: bool | None = None,
    sort: str = "name",
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
):
    query: dict = {"status": PUBLISHED}
    if category:
        cat = await db.categories.find_one({"slug": category})
        query["category_id"] = cat["_id"] if cat else "__none__"
    if industry:
        ind = await db.industries.find_one({"slug": industry})
        query["industry_ids"] = ind["_id"] if ind else "__none__"
    if featured is not None:
        query["featured"] = featured
    if q:
        term = re.escape(q.strip()[:120])
        rx = {"$regex": term, "$options": "i"}
        query["$or"] = [{"name": rx}, {"product_code": rx}, {"summary": rx},
                        {"description": rx}, {"applications": rx},
                        {"specifications.value": rx}, {"specifications.label": rx}]

    sort_map = {
        "name": [("name", 1)],
        "recent": [("created_at", -1)],
        "featured": [("featured", -1), ("sort_order", 1), ("name", 1)],
    }
    sort_spec = sort_map.get(sort, sort_map["name"])
    total = await db.products.count_documents(query)
    docs = await db.products.find(query).sort(sort_spec) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    items = await _attach_category(serialize_many(docs))
    return {"items": items, "total": total, "page": page, "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size)}


@public_router.get("/products/{slug}")
async def get_product(slug: str):
    product = await db.products.find_one({"slug": slug, "status": PUBLISHED})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    item = serialize(product)
    category = await db.categories.find_one({"_id": product.get("category_id"), "status": PUBLISHED})
    industries = await db.industries.find(
        {"_id": {"$in": product.get("industry_ids", [])}, "status": PUBLISHED}).to_list(20)
    related_query = {"status": PUBLISHED, "_id": {"$ne": product["_id"]}}
    if product.get("category_id"):
        related_query["category_id"] = product["category_id"]
    related = await db.products.find(related_query).limit(3).to_list(3)
    return {"product": item, "category": serialize(category), "industries": serialize_many(industries),
            "related": serialize_many(related)}


@public_router.post("/enquiries", status_code=201)
async def create_enquiry(payload: EnquiryCreate, request: Request):
    ip = client_ip(request)
    if not rate_limiter.allow(f"enquiry:{ip}", limit=5, window=600):
        raise HTTPException(status_code=429, detail="Too many submissions. Please try again later.")
    if (payload.company_website or "").strip():
        raise HTTPException(status_code=400, detail="Submission rejected")

    email = payload.email.lower()
    requirement = (payload.requirement or "").strip()
    duplicate = await db.enquiries.find_one({
        "email": email,
        "requirement": requirement or None,
        "city": payload.city.strip(),
        "created_at": {"$gte": (await _recent_cutoff())},
    })
    if duplicate:
        return {"reference_number": duplicate["reference_number"], "duplicate": True}

    product = await db.products.find_one({"slug": payload.product_slug, "status": PUBLISHED}) if payload.product_slug else None
    category = await db.categories.find_one({"slug": payload.category_slug, "status": PUBLISHED}) if payload.category_slug else None
    industry = await db.industries.find_one({"slug": payload.industry_slug, "status": PUBLISHED}) if payload.industry_slug else None

    seq = await db.counters.find_one_and_update(
        {"_id": "enquiry"}, {"$inc": {"value": 1}}, upsert=True, return_document=True)
    reference = f"TC-{now_iso()[:4]}-{str(seq['value']).zfill(5)}"

    doc = {
        "_id": new_id(),
        "reference_number": reference,
        "name": payload.name.strip(),
        "company_name": payload.company_name.strip(),
        "email": email,
        "phone": payload.phone,
        "city": payload.city.strip(),
        "enquirer_type": payload.enquirer_type,
        "industry_id": industry["_id"] if industry else None,
        "industry_name": industry["name"] if industry else None,
        "product_id": product["_id"] if product else None,
        "product_name": product["name"] if product else None,
        "product_slug": product["slug"] if product else None,
        "product_category_id": (category or {}).get("_id") or (product or {}).get("category_id"),
        "requirement": requirement or None,
        "source_page": payload.source_page,
        "status": "new",
        "priority": "normal",
        "assigned_admin_id": None,
        "notification_status": "not_configured",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.enquiries.insert_one(doc)
    await db.enquiry_status_history.insert_one({
        "_id": new_id(), "enquiry_id": doc["_id"], "from_status": None, "to_status": "new",
        "actor": "public_form", "created_at": now_iso(),
    })
    return {"reference_number": reference, "duplicate": False}


async def _recent_cutoff() -> str:
    from datetime import datetime, timezone, timedelta
    return (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()


@public_router.get("/sitemap.xml")
async def sitemap():
    base = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")
    urls = ["/", "/about", "/products", "/industries", "/technology", "/sustainability",
            "/directors", "/contact", "/request-quote", "/privacy-policy"]
    products = await db.products.find({"status": PUBLISHED}, {"slug": 1}).to_list(1000)
    categories = await db.categories.find({"status": PUBLISHED}, {"slug": 1}).to_list(500)
    industries = await db.industries.find({"status": PUBLISHED}, {"slug": 1}).to_list(500)
    urls += [f"/products/{p['slug']}" for p in products]
    urls += [f"/products/category/{c['slug']}" for c in categories]
    urls += [f"/industries/{i['slug']}" for i in industries]
    body = "".join(f"<url><loc>{base}{u}</loc></url>" for u in urls)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>'
    return RawResponse(content=xml, media_type="application/xml")
