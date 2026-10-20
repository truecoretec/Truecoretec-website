from datetime import datetime, timezone, timedelta
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import get_current_admin, require_content, require_enquiry, require_super
from core import (db, new_id, now_iso, serialize, serialize_many, slugify, log_audit,
                  CONTENT_STATUSES, ENQUIRY_STATUSES, ENQUIRY_PRIORITIES, PUBLISHED)

admin_router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------- schemas ----------
class SpecIn(BaseModel):
    label: str = Field(max_length=120)
    value: str = Field(max_length=200)
    unit: str | None = Field(default=None, max_length=40)
    notes: str | None = Field(default=None, max_length=300)


class VariantIn(BaseModel):
    name: str = Field(max_length=120)
    detail: str | None = Field(default=None, max_length=300)


class DocumentIn(BaseModel):
    title: str = Field(max_length=160)
    url: str = Field(max_length=600)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str | None = None
    product_code: str | None = Field(default=None, max_length=60)
    category_id: str | None = None
    summary: str | None = Field(default=None, max_length=400)
    description: str | None = Field(default=None, max_length=6000)
    image_url: str | None = Field(default=None, max_length=600)
    gallery: list[str] = []
    industry_ids: list[str] = []
    applications: list[str] = []
    specifications: list[SpecIn] = []
    variants: list[VariantIn] = []
    documents: list[DocumentIn] = []
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    featured: bool = False
    status: str = "draft"
    sort_order: int = 0


class CategoryIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str | None = None
    summary: str | None = Field(default=None, max_length=400)
    description: str | None = Field(default=None, max_length=4000)
    image_url: str | None = Field(default=None, max_length=600)
    parent_id: str | None = None
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    sort_order: int = 0
    status: str = "draft"


class IndustryIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str | None = None
    overview: str | None = Field(default=None, max_length=4000)
    applications: list[str] = []
    requirements: str | None = Field(default=None, max_length=3000)
    image_url: str | None = Field(default=None, max_length=600)
    category_ids: list[str] = []
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    sort_order: int = 0
    status: str = "draft"


class DirectorIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    designation: str | None = Field(default=None, max_length=160)
    short_intro: str | None = Field(default=None, max_length=600)
    bio: str | None = Field(default=None, max_length=3000)
    photo_url: str | None = Field(default=None, max_length=600)
    linkedin_url: str | None = Field(default=None, max_length=400)
    sort_order: int = 0
    status: str = "draft"


class SectionIn(BaseModel):
    key: str = Field(max_length=60)
    heading: str | None = Field(default=None, max_length=200)
    subheading: str | None = Field(default=None, max_length=300)
    body: str | None = Field(default=None, max_length=8000)
    image_url: str | None = Field(default=None, max_length=600)


class PageIn(BaseModel):
    title: str | None = Field(default=None, max_length=160)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    status: str | None = None
    sections: list[SectionIn] | None = None


class MediaIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    url: str = Field(min_length=5, max_length=600)
    alt_text: str | None = Field(default=None, max_length=200)
    caption: str | None = Field(default=None, max_length=300)
    kind: str = "image"


class SettingsIn(BaseModel):
    company_name: str | None = Field(default=None, max_length=180)
    tagline: str | None = Field(default=None, max_length=200)
    positioning: str | None = Field(default=None, max_length=200)
    logo_url: str | None = Field(default=None, max_length=600)
    contact_email: str | None = Field(default=None, max_length=254)
    alternate_email: str | None = Field(default=None, max_length=254)
    contact_phone: str | None = Field(default=None, max_length=40)
    alternate_phone: str | None = Field(default=None, max_length=40)
    cin: str | None = Field(default=None, max_length=40)
    whatsapp_number: str | None = Field(default=None, max_length=20)
    whatsapp_message: str | None = Field(default=None, max_length=600)
    address: str | None = Field(default=None, max_length=400)
    business_hours: str | None = Field(default=None, max_length=200)
    social_links: dict | None = None
    enquiry_recipients: str | None = Field(default=None, max_length=400)
    default_seo_title: str | None = Field(default=None, max_length=180)
    default_seo_description: str | None = Field(default=None, max_length=320)
    analytics_id: str | None = Field(default=None, max_length=60)
    map_embed_url: str | None = Field(default=None, max_length=800)
    industries_hero_url: str | None = Field(default=None, max_length=600)
    pending_approval_note: str | None = Field(default=None, max_length=400)


class EnquiryUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_admin_id: str | None = None
    closure_reason: str | None = Field(default=None, max_length=300)


class NoteIn(BaseModel):
    note: str = Field(min_length=2, max_length=2000)


# ---------- helpers ----------
def _check_status(status: str | None):
    if status and status not in CONTENT_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")


async def _unique_slug(collection, base: str, exclude_id: str | None = None) -> str:
    slug = slugify(base) or new_id()[:8]
    candidate, i = slug, 2
    while True:
        existing = await collection.find_one({"slug": candidate})
        if not existing or existing["_id"] == exclude_id:
            return candidate
        candidate = f"{slug}-{i}"
        i += 1


# ---------- dashboard ----------
@admin_router.get("/dashboard")
async def dashboard(admin: dict = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    d7 = (now - timedelta(days=7)).isoformat()
    d30 = (now - timedelta(days=30)).isoformat()
    by_status = {}
    for status in ENQUIRY_STATUSES:
        by_status[status] = await db.enquiries.count_documents({"status": status})
    recent = await db.enquiries.find({}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "total_enquiries": await db.enquiries.count_documents({}),
        "open_enquiries": await db.enquiries.count_documents({"status": {"$in": ["new", "notified", "in_progress"]}}),
        "last_7_days": await db.enquiries.count_documents({"created_at": {"$gte": d7}}),
        "last_30_days": await db.enquiries.count_documents({"created_at": {"$gte": d30}}),
        "by_status": by_status,
        "products_published": await db.products.count_documents({"status": PUBLISHED}),
        "products_draft": await db.products.count_documents({"status": "draft"}),
        "categories_published": await db.categories.count_documents({"status": PUBLISHED}),
        "industries_published": await db.industries.count_documents({"status": PUBLISHED}),
        "recent_enquiries": serialize_many(recent),
        "email_notifications_configured": False,
    }


# ---------- products ----------
@admin_router.get("/products")
async def admin_list_products(q: str | None = None, status: str | None = None,
                              page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                              admin: dict = Depends(get_current_admin)):
    query: dict = {}
    if status:
        query["status"] = status
    if q:
        query["$or"] = [{"name": {"$regex": q, "$options": "i"}},
                        {"product_code": {"$regex": q, "$options": "i"}}]
    total = await db.products.count_documents(query)
    docs = await db.products.find(query).sort([("sort_order", 1), ("name", 1)]) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"items": serialize_many(docs), "total": total, "page": page, "page_size": page_size}


@admin_router.post("/products", status_code=201)
async def create_product(payload: ProductIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    data = payload.model_dump()
    data["slug"] = await _unique_slug(db.products, payload.slug or payload.name)
    data["_id"] = new_id()
    data["created_at"] = now_iso()
    data["updated_at"] = now_iso()
    await db.products.insert_one(data)
    await log_audit(admin, "create", "product", data["_id"], payload.name)
    return serialize(data)


@admin_router.get("/products/{product_id}")
async def get_admin_product(product_id: str, admin: dict = Depends(get_current_admin)):
    doc = await db.products.find_one({"_id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize(doc)


@admin_router.patch("/products/{product_id}")
async def update_product(product_id: str, payload: ProductIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    doc = await db.products.find_one({"_id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    data = payload.model_dump()
    data["slug"] = await _unique_slug(
        db.products, payload.slug or doc.get("slug") or payload.name, exclude_id=product_id)
    data["updated_at"] = now_iso()
    await db.products.update_one({"_id": product_id}, {"$set": data})
    await log_audit(admin, "update", "product", product_id, payload.name)
    return serialize(await db.products.find_one({"_id": product_id}))


@admin_router.delete("/products/{product_id}")
async def archive_product(product_id: str, admin: dict = Depends(require_content)):
    result = await db.products.update_one({"_id": product_id}, {"$set": {"status": "archived", "updated_at": now_iso()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Product not found")
    await log_audit(admin, "archive", "product", product_id)
    return {"success": True, "status": "archived"}


# ---------- categories ----------
@admin_router.get("/categories")
async def admin_list_categories(admin: dict = Depends(get_current_admin)):
    docs = await db.categories.find({}).sort([("sort_order", 1), ("name", 1)]).to_list(300)
    return serialize_many(docs)


@admin_router.post("/categories", status_code=201)
async def create_category(payload: CategoryIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    data = payload.model_dump()
    data["slug"] = await _unique_slug(db.categories, payload.slug or payload.name)
    data["_id"] = new_id()
    data["created_at"] = now_iso()
    data["updated_at"] = now_iso()
    await db.categories.insert_one(data)
    await log_audit(admin, "create", "category", data["_id"], payload.name)
    return serialize(data)


@admin_router.patch("/categories/{category_id}")
async def update_category(category_id: str, payload: CategoryIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    existing = await db.categories.find_one({"_id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    data = payload.model_dump()
    data["slug"] = await _unique_slug(
        db.categories, payload.slug or existing.get("slug") or payload.name, exclude_id=category_id)
    data["updated_at"] = now_iso()
    await db.categories.update_one({"_id": category_id}, {"$set": data})
    await log_audit(admin, "update", "category", category_id, payload.name)
    return serialize(await db.categories.find_one({"_id": category_id}))


@admin_router.delete("/categories/{category_id}")
async def archive_category(category_id: str, admin: dict = Depends(require_content)):
    result = await db.categories.update_one({"_id": category_id}, {"$set": {"status": "archived"}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Category not found")
    await log_audit(admin, "archive", "category", category_id)
    return {"success": True}


# ---------- industries ----------
@admin_router.get("/industries")
async def admin_list_industries(admin: dict = Depends(get_current_admin)):
    docs = await db.industries.find({}).sort([("sort_order", 1), ("name", 1)]).to_list(300)
    return serialize_many(docs)


@admin_router.post("/industries", status_code=201)
async def create_industry(payload: IndustryIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    data = payload.model_dump()
    data["slug"] = await _unique_slug(db.industries, payload.slug or payload.name)
    data["_id"] = new_id()
    data["created_at"] = now_iso()
    data["updated_at"] = now_iso()
    await db.industries.insert_one(data)
    await log_audit(admin, "create", "industry", data["_id"], payload.name)
    return serialize(data)


@admin_router.patch("/industries/{industry_id}")
async def update_industry(industry_id: str, payload: IndustryIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    existing = await db.industries.find_one({"_id": industry_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Industry not found")
    data = payload.model_dump()
    data["slug"] = await _unique_slug(
        db.industries, payload.slug or existing.get("slug") or payload.name, exclude_id=industry_id)
    data["updated_at"] = now_iso()
    await db.industries.update_one({"_id": industry_id}, {"$set": data})
    await log_audit(admin, "update", "industry", industry_id, payload.name)
    return serialize(await db.industries.find_one({"_id": industry_id}))


@admin_router.delete("/industries/{industry_id}")
async def archive_industry(industry_id: str, admin: dict = Depends(require_content)):
    result = await db.industries.update_one({"_id": industry_id}, {"$set": {"status": "archived"}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Industry not found")
    await log_audit(admin, "archive", "industry", industry_id)
    return {"success": True}


# ---------- directors ----------
@admin_router.get("/directors")
async def admin_list_directors(admin: dict = Depends(get_current_admin)):
    docs = await db.directors.find({}).sort([("sort_order", 1), ("name", 1)]).to_list(100)
    return serialize_many(docs)


@admin_router.post("/directors", status_code=201)
async def create_director(payload: DirectorIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    data = payload.model_dump()
    data["_id"] = new_id()
    data["created_at"] = now_iso()
    await db.directors.insert_one(data)
    await log_audit(admin, "create", "director", data["_id"], payload.name)
    return serialize(data)


@admin_router.patch("/directors/{director_id}")
async def update_director(director_id: str, payload: DirectorIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    if not await db.directors.find_one({"_id": director_id}):
        raise HTTPException(status_code=404, detail="Director not found")
    await db.directors.update_one({"_id": director_id}, {"$set": payload.model_dump()})
    await log_audit(admin, "update", "director", director_id, payload.name)
    return serialize(await db.directors.find_one({"_id": director_id}))


@admin_router.delete("/directors/{director_id}")
async def archive_director(director_id: str, admin: dict = Depends(require_content)):
    result = await db.directors.update_one({"_id": director_id}, {"$set": {"status": "archived"}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Director not found")
    await log_audit(admin, "archive", "director", director_id)
    return {"success": True}


# ---------- page content ----------
@admin_router.get("/content")
async def list_content(admin: dict = Depends(get_current_admin)):
    docs = await db.page_content.find({}).sort("slug", 1).to_list(50)
    return serialize_many(docs)


@admin_router.get("/content/{slug}")
async def get_content(slug: str, admin: dict = Depends(get_current_admin)):
    doc = await db.page_content.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize(doc)


@admin_router.patch("/content/{slug}")
async def update_content(slug: str, payload: PageIn, admin: dict = Depends(require_content)):
    _check_status(payload.status)
    doc = await db.page_content.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "sections" in updates:
        updates["sections"] = [dict(s) for s in updates["sections"]]
    updates["updated_at"] = now_iso()
    await db.page_content.update_one({"slug": slug}, {"$set": updates})
    await log_audit(admin, "update", "page_content", slug, f"Updated {', '.join(updates.keys())}")
    return serialize(await db.page_content.find_one({"slug": slug}))


# ---------- media ----------
@admin_router.get("/media")
async def list_media(admin: dict = Depends(get_current_admin)):
    docs = await db.media_assets.find({}).sort("created_at", -1).to_list(300)
    return serialize_many(docs)


@admin_router.post("/media", status_code=201)
async def create_media(payload: MediaIn, admin: dict = Depends(require_content)):
    if not payload.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Media URL must start with http:// or https://")
    data = payload.model_dump()
    data["_id"] = new_id()
    data["created_at"] = now_iso()
    await db.media_assets.insert_one(data)
    await log_audit(admin, "create", "media", data["_id"], payload.title)
    return serialize(data)


@admin_router.delete("/media/{media_id}")
async def delete_media(media_id: str, admin: dict = Depends(require_content)):
    result = await db.media_assets.delete_one({"_id": media_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Media not found")
    await log_audit(admin, "delete", "media", media_id)
    return {"success": True}


# ---------- settings ----------
@admin_router.get("/settings")
async def get_admin_settings(admin: dict = Depends(get_current_admin)):
    return serialize(await db.site_settings.find_one({"_id": "site"}))


@admin_router.patch("/settings")
async def update_settings(payload: SettingsIn, admin: dict = Depends(require_super)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No permitted fields to update")
    updates["updated_at"] = now_iso()
    await db.site_settings.update_one({"_id": "site"}, {"$set": updates})
    await log_audit(admin, "update", "site_settings", "site", f"Updated {', '.join(updates.keys())}")
    return serialize(await db.site_settings.find_one({"_id": "site"}))


# ---------- enquiries ----------
@admin_router.get("/enquiries")
async def list_enquiries(q: str | None = None, status: str | None = None, priority: str | None = None,
                         date_from: str | None = None, date_to: str | None = None,
                         page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                         admin: dict = Depends(require_enquiry)):
    query: dict = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if date_from or date_to:
        created: dict = {}
        if date_from:
            created["$gte"] = date_from
        if date_to:
            created["$lte"] = date_to + "T23:59:59"
        query["created_at"] = created
    if q:
        rx = {"$regex": q, "$options": "i"}
        query["$or"] = [{"reference_number": rx}, {"name": rx}, {"company_name": rx},
                        {"email": rx}, {"product_name": rx}]
    total = await db.enquiries.count_documents(query)
    docs = await db.enquiries.find(query).sort("created_at", -1) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"items": serialize_many(docs), "total": total, "page": page, "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size)}


@admin_router.get("/enquiries/export")
async def export_enquiries(admin: dict = Depends(require_enquiry)):
    docs = await db.enquiries.find({}).sort("created_at", -1).to_list(5000)
    buffer = io.StringIO()
    fields = ["reference_number", "created_at", "status", "priority", "name", "company_name",
              "email", "phone", "city", "enquirer_type", "product_name", "industry_name",
              "requirement", "source_page"]
    writer = csv.DictWriter(buffer, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for d in docs:
        writer.writerow({k: d.get(k, "") for k in fields})
    await log_audit(admin, "export", "enquiries", None, f"{len(docs)} records")
    buffer.seek(0)
    return StreamingResponse(iter([buffer.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=enquiries.csv"})


@admin_router.get("/enquiries/{enquiry_id}")
async def get_enquiry(enquiry_id: str, admin: dict = Depends(require_enquiry)):
    doc = await db.enquiries.find_one({"_id": enquiry_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    notes = await db.enquiry_notes.find({"enquiry_id": enquiry_id}).sort("created_at", -1).to_list(100)
    history = await db.enquiry_status_history.find({"enquiry_id": enquiry_id}).sort("created_at", 1).to_list(100)
    return {"enquiry": serialize(doc), "notes": serialize_many(notes), "history": serialize_many(history)}


@admin_router.patch("/enquiries/{enquiry_id}")
async def update_enquiry(enquiry_id: str, payload: EnquiryUpdate, admin: dict = Depends(require_enquiry)):
    doc = await db.enquiries.find_one({"_id": enquiry_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    updates: dict = {}
    if payload.status:
        if payload.status not in ENQUIRY_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        updates["status"] = payload.status
    if payload.priority:
        if payload.priority not in ENQUIRY_PRIORITIES:
            raise HTTPException(status_code=400, detail="Invalid priority")
        updates["priority"] = payload.priority
    if payload.assigned_admin_id is not None:
        assignee = payload.assigned_admin_id or None
        if assignee and not await db.admin_users.find_one({"_id": assignee}):
            raise HTTPException(status_code=400, detail="Invalid assignee")
        updates["assigned_admin_id"] = assignee
    if payload.closure_reason is not None:
        updates["closure_reason"] = payload.closure_reason
    if not updates:
        raise HTTPException(status_code=400, detail="No permitted fields to update")
    updates["updated_at"] = now_iso()
    await db.enquiries.update_one({"_id": enquiry_id}, {"$set": updates})
    if "status" in updates and updates["status"] != doc.get("status"):
        await db.enquiry_status_history.insert_one({
            "_id": new_id(), "enquiry_id": enquiry_id, "from_status": doc.get("status"),
            "to_status": updates["status"], "actor": admin["username"], "created_at": now_iso(),
        })
        await log_audit(admin, "status_change", "enquiry", enquiry_id,
                        f"{doc.get('status')} -> {updates['status']}")
    return serialize(await db.enquiries.find_one({"_id": enquiry_id}))


@admin_router.post("/enquiries/{enquiry_id}/notes", status_code=201)
async def add_note(enquiry_id: str, payload: NoteIn, admin: dict = Depends(require_enquiry)):
    if not await db.enquiries.find_one({"_id": enquiry_id}):
        raise HTTPException(status_code=404, detail="Enquiry not found")
    doc = {"_id": new_id(), "enquiry_id": enquiry_id, "note": payload.note.strip(),
           "author": admin["username"], "created_at": now_iso()}
    await db.enquiry_notes.insert_one(doc)
    await log_audit(admin, "note", "enquiry", enquiry_id, "Internal note added")
    return serialize(doc)


# ---------- audit logs ----------
@admin_router.get("/audit-logs")
async def audit_logs(page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
                     admin: dict = Depends(require_super)):
    total = await db.audit_logs.count_documents({})
    docs = await db.audit_logs.find({}).sort("created_at", -1) \
        .skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return {"items": serialize_many(docs), "total": total, "page": page, "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size)}
