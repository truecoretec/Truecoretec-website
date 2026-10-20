import os
import re
import uuid
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

from content_defaults import (HOME_SECTIONS, ABOUT_SECTIONS, TECHNOLOGY_SECTIONS,
                              SUSTAINABILITY_SECTIONS, INDUSTRIES_SECTIONS, DIRECTORS)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]

PUBLISHED = "published"
DRAFT = "draft"
ARCHIVED = "archived"
CONTENT_STATUSES = [DRAFT, PUBLISHED, ARCHIVED]

ENQUIRY_STATUSES = ["new", "notified", "in_progress", "responded", "qualified", "closed"]
ENQUIRY_PRIORITIES = ["low", "normal", "high", "urgent"]
ROLES = ["super_admin", "content_manager", "enquiry_manager"]
ENQUIRER_TYPES = ["customer", "investor_analyst", "vendor", "job_seeker"]


def new_id() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9\s-]", "", (value or "").strip().lower())
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-")


def serialize(doc: dict | None) -> dict | None:
    """Map a Mongo document to an API-safe dict (_id -> id)."""
    if not doc:
        return None
    out = {k: v for k, v in doc.items() if k != "_id"}
    out["id"] = doc.get("_id")
    return out


def serialize_many(docs) -> list:
    return [serialize(d) for d in docs]


class RateLimiter:
    """Simple in-process fixed-window limiter."""

    def __init__(self):
        self._hits: dict[str, list[float]] = {}

    def allow(self, key: str, limit: int, window: int) -> bool:
        now = time.time()
        hits = [t for t in self._hits.get(key, []) if now - t < window]
        if len(hits) >= limit:
            self._hits[key] = hits
            return False
        hits.append(now)
        self._hits[key] = hits
        return True


rate_limiter = RateLimiter()


def client_ip(request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def log_audit(actor: dict, action: str, entity: str, entity_id: str | None = None, detail: str = ""):
    await db.audit_logs.insert_one({
        "_id": new_id(),
        "actor_id": actor.get("id") if actor else None,
        "actor_username": actor.get("username") if actor else None,
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "detail": detail,
        "created_at": now_iso(),
    })


async def ensure_indexes():
    await db.admin_users.create_index("username", unique=True)
    await db.admin_users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index([("status", 1), ("sort_order", 1)])
    await db.products.create_index("category_id")
    await db.categories.create_index("slug", unique=True)
    await db.industries.create_index("slug", unique=True)
    await db.enquiries.create_index("reference_number", unique=True)
    await db.enquiries.create_index([("created_at", -1)])
    await db.enquiries.create_index("status")
    await db.enquiries.create_index("email")
    await db.page_content.create_index("slug", unique=True)
    await db.audit_logs.create_index([("created_at", -1)])


DEFAULT_SETTINGS = {
    "_id": "site",
    "company_name": "TRUECORE TECHNOLOGIES PVT. LTD.",
    "tagline": "Advanced Materials. A Stronger Tomorrow.",
    "positioning": "Manufacturers of High-Performance PU Products",
    "logo_url": "",
    "contact_email": "",
    "alternate_email": "",
    "contact_phone": "",
    "alternate_phone": "",
    "cin": "",
    "whatsapp_number": "",
    "whatsapp_message": (
        "Hello TrueCore Technologies, I would like to enquire about your PU products and "
        "engineered material solutions. Please share more information about your products "
        "and suitability for my application."
    ),
    "address": "",
    "business_hours": "",
    "social_links": {"linkedin": "", "twitter": "", "youtube": ""},
    "enquiry_recipients": "",
    "default_seo_title": "TrueCore Technologies Pvt. Ltd. | Advanced Materials. A Stronger Tomorrow.",
    "default_seo_description": (
        "TrueCore Technologies Pvt. Ltd. manufactures high-performance polyurethane (PU) products "
        "and engineered material solutions for railway, automotive, mobility and industrial applications."
    ),
    "analytics_id": "",
    "map_embed_url": "",
    "industries_hero_url": "",
    "pending_approval_note": "Contact details, address and logo are placeholders pending company approval.",
    "updated_at": now_iso(),
}


PAGE_DEFS = [
    {
        "slug": "home", "title": "Home", "sections": HOME_SECTIONS,
        "seo_title": "TrueCore Technologies Pvt. Ltd. | Advanced Materials. A Stronger Tomorrow.",
        "seo_description": DEFAULT_SETTINGS["default_seo_description"],
    },
    {
        "slug": "about", "title": "About Us", "sections": ABOUT_SECTIONS,
        "seo_title": "About TrueCore Technologies Pvt. Ltd.",
        "seo_description": ("An advanced materials company focused on engineered polymer solutions for "
                            "Railways, Automotive, Mobility and Industrial applications."),
    },
    {
        "slug": "technology", "title": "Technology", "sections": TECHNOLOGY_SECTIONS,
        "seo_title": "Technology & Manufacturing | TrueCore Technologies",
        "seo_description": ("Building integrated polymer manufacturing capabilities: precision TPU "
                            "moulding and cast polyurethane processing for railway, automotive and "
                            "industrial components."),
    },
    {
        "slug": "industries", "title": "Industries We Cater", "sections": INDUSTRIES_SECTIONS,
        "seo_title": "Industries We Cater | TrueCore Technologies Pvt. Ltd.",
        "seo_description": ("Engineered polyurethane, TPU and advanced polymer solutions for railway, "
                            "automotive and EV, industrial, metro and custom engineering applications."),
    },
    {
        "slug": "sustainability", "title": "Sustainability", "sections": SUSTAINABILITY_SECTIONS,
        "seo_title": "Sustainability | TrueCore Technologies Pvt. Ltd.",
        "seo_description": ("Sustainability at TrueCore: responsible business development, long-term "
                            "value creation and future-oriented strategy."),
    },
    {
        "slug": "privacy-policy", "title": "Privacy Policy",
        "seo_title": "Privacy Policy | TrueCore Technologies Pvt. Ltd.",
        "seo_description": "How TrueCore Technologies collects, uses and retains information submitted through this website.",
        "sections": [
            {"key": "collection", "heading": "Information We Collect", "subheading": "",
             "body": ("When you submit an enquiry we collect your name, company name, email, phone "
                      "number, city, the category you identify with and any requirement details you "
                      "choose to share. We may also record the page from which the enquiry originated "
                      "and the submission time."),
             "image_url": ""},
            {"key": "use", "heading": "Why We Collect It", "subheading": "",
             "body": ("Information is used solely to understand, respond to and follow up on your "
                      "enquiry, and to maintain an internal record of business communication."),
             "image_url": ""},
            {"key": "retention", "heading": "Retention", "subheading": "",
             "body": ("Enquiry records are retained for as long as required for business and legal "
                      "purposes and are accessible only to authorised staff. Retention periods are "
                      "configurable and reviewed periodically."),
             "image_url": ""},
            {"key": "requests", "heading": "Your Requests", "subheading": "",
             "body": ("You may contact us using the details on the Contact page to ask about the "
                      "information we hold concerning your enquiry, or to request correction or "
                      "deletion where applicable."),
             "image_url": ""},
            {"key": "review", "heading": "Approval Status", "subheading": "",
             "body": ("This policy is a working draft. Final legal wording is subject to company review "
                      "and applicable Indian data protection requirements."),
             "image_url": ""},
        ],
    },
]


def page_document(definition: dict) -> dict:
    return {
        "_id": new_id(),
        "slug": definition["slug"],
        "title": definition["title"],
        "status": PUBLISHED,
        "seo_title": definition["seo_title"],
        "seo_description": definition["seo_description"],
        "sections": [dict(s) for s in definition["sections"]],
        "updated_at": now_iso(),
    }


async def seed_content():
    if not await db.site_settings.find_one({"_id": "site"}):
        await db.site_settings.insert_one(dict(DEFAULT_SETTINGS))
    for definition in PAGE_DEFS:
        if not await db.page_content.find_one({"slug": definition["slug"]}):
            await db.page_content.insert_one(page_document(definition))
    for director in DIRECTORS:
        if not await db.directors.find_one({"name": director["name"]}):
            await db.directors.insert_one({
                "_id": new_id(), **director, "linkedin_url": "",
                "status": PUBLISHED, "created_at": now_iso(),
            })
