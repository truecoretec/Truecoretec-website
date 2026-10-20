"""Push the canonical approved copy in content_defaults.py into an existing database."""
import asyncio

from core import db, now_iso, new_id, PUBLISHED, PAGE_DEFS, page_document
from content_defaults import DIRECTORS, INDUSTRIES_HERO


async def main():
    for definition in PAGE_DEFS:
        doc = page_document(definition)
        existing = await db.page_content.find_one({"slug": definition["slug"]})
        if existing:
            await db.page_content.update_one({"slug": definition["slug"]}, {"$set": {
                "title": doc["title"], "sections": doc["sections"], "status": PUBLISHED,
                "seo_title": doc["seo_title"], "seo_description": doc["seo_description"],
                "updated_at": now_iso(),
            }})
            print("updated page:", definition["slug"])
        else:
            await db.page_content.insert_one(doc)
            print("inserted page:", definition["slug"])

    for director in DIRECTORS:
        existing = await db.directors.find_one({"name": director["name"]})
        if existing:
            await db.directors.update_one({"_id": existing["_id"]}, {"$set": {**director, "status": PUBLISHED}})
            print("updated director:", director["name"])
        else:
            await db.directors.insert_one({"_id": new_id(), **director, "linkedin_url": "",
                                           "status": PUBLISHED, "created_at": now_iso()})
            print("inserted director:", director["name"])

    await db.site_settings.update_one({"_id": "site"}, {"$set": {
        "industries_hero_url": INDUSTRIES_HERO,
        "contact_email": "enquiry@truecoretec.com",
        "alternate_email": "truecoretec@gmail.com",
        "contact_phone": "+91 63948 12646",
        "alternate_phone": "+91 76199 32431",
        "cin": "U20131UP2026PTC251661",
        "address": ("Kh-1245, Yas Puram, Raj Estate Marriage Lawn, Rajajipuram, "
                    "Lucknow – 226017, Uttar Pradesh, India"),
    }})
    print("verified contact details applied")


if __name__ == "__main__":
    asyncio.run(main())
