"""End-to-end backend API tests for TrueCore Technologies.

Covers: public catalogue, enquiry submission, admin auth/RBAC,
product/category/industry CRUD, settings, page content, audit logs.
Test-created data is cleaned up at module teardown.
"""
import os
import time
import uuid

import pytest
import requests

def _read_frontend_env():
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"')
    except Exception:
        pass
    return None


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _read_frontend_env() or "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL not configured"
API = f"{BASE_URL}/api"

ADMIN_ID = "admin"
ADMIN_PW = "admin@123"

CREATED = {"products": [], "categories": [], "industries": [], "users": [], "enquiries": []}


# ---------- fixtures ----------
@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login",
                      json={"identifier": ADMIN_ID, "password": ADMIN_PW}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and data["user"]["role"] == "super_admin"
    return data["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- health / public ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"
        assert data["email_notifications"] == "not_configured"

    def test_settings_public(self):
        r = requests.get(f"{API}/settings", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert "enquiry_recipients" not in data

    def test_sitemap(self):
        r = requests.get(f"{API}/sitemap.xml", timeout=10)
        assert r.status_code == 200
        assert "urlset" in r.text

    def test_products_list_empty_shape(self):
        r = requests.get(f"{API}/products", timeout=10)
        assert r.status_code == 200
        data = r.json()
        for k in ("items", "total", "page", "page_size", "pages"):
            assert k in data

    def test_industries_list(self):
        r = requests.get(f"{API}/industries", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_directors_list(self):
        r = requests.get(f"{API}/directors", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- admin auth ----------
class TestAdminAuth:
    def test_login_bad_password(self):
        r = requests.post(f"{API}/auth/login",
                          json={"identifier": ADMIN_ID, "password": "wrong-pw"}, timeout=10)
        assert r.status_code == 401

    def test_login_email_identifier(self):
        r = requests.post(f"{API}/auth/login",
                          json={"identifier": "shreyanshsingh5555@gmail.com", "password": ADMIN_PW},
                          timeout=10)
        assert r.status_code == 200

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_admin_dashboard_requires_auth(self):
        r = requests.get(f"{API}/admin/dashboard", timeout=10)
        assert r.status_code == 401

    def test_users_requires_auth(self):
        r = requests.get(f"{API}/auth/users", timeout=10)
        assert r.status_code == 401

    def test_me_with_token(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["role"] == "super_admin"


# ---------- enquiries (public) - new schema: city + enquirer_type required, requirement optional ----------
def _base_payload(**overrides):
    base = {
        "name": "TEST QA User",
        "company_name": "TEST_CO " + uuid.uuid4().hex[:6],
        "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
        "phone": "+91 9876543210",
        "city": "Pune",
        "enquirer_type": "customer",
    }
    base.update(overrides)
    return base


def _fresh_ip_headers():
    # Vary X-Forwarded-For to bypass per-IP rate-limit across tests
    oct_ = uuid.uuid4().int % 254 + 1
    return {"X-Forwarded-For": f"10.{oct_}.{oct_}.{oct_}"}


class TestEnquiries:
    def test_create_enquiry_without_requirement_ok(self):
        payload = _base_payload()
        r = requests.post(f"{API}/enquiries", json=payload, headers=_fresh_ip_headers(), timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["reference_number"].startswith("TC-")
        assert data["duplicate"] is False
        CREATED["enquiries"].append(data["reference_number"])

    def test_create_enquiry_with_requirement_ok(self):
        payload = _base_payload(requirement="Looking for a PU wear ring, OD 120mm.")
        r = requests.post(f"{API}/enquiries", json=payload, headers=_fresh_ip_headers(), timeout=15)
        assert r.status_code == 201, r.text
        CREATED["enquiries"].append(r.json()["reference_number"])

    def test_create_enquiry_invalid_email(self):
        p = _base_payload(email="not-an-email")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 422

    def test_create_enquiry_short_phone(self):
        p = _base_payload(phone="12")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 422

    def test_create_enquiry_missing_city(self):
        p = _base_payload()
        p.pop("city")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 422

    def test_create_enquiry_bad_enquirer_type(self):
        p = _base_payload(enquirer_type="hacker")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 422

    def test_create_enquiry_missing_enquirer_type(self):
        p = _base_payload()
        p.pop("enquirer_type")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 422

    def test_allowed_enquirer_types(self):
        # All four allowed values should be accepted
        for t in ["customer", "investor_analyst", "vendor", "job_seeker"]:
            p = _base_payload(enquirer_type=t,
                              email=f"typecheck_{t}_{uuid.uuid4().hex[:5]}@example.com")
            r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
            assert r.status_code == 201, f"{t} rejected: {r.text}"
            CREATED["enquiries"].append(r.json()["reference_number"])

    def test_enquiry_duplicate_suppression(self):
        email = f"dup_{uuid.uuid4().hex[:6]}@example.com"
        payload = _base_payload(email=email, city="Mumbai",
                                requirement="PU rollers in bulk for conveyor systems.")
        r1 = requests.post(f"{API}/enquiries", json=payload, headers=_fresh_ip_headers(), timeout=10)
        r2 = requests.post(f"{API}/enquiries", json=payload, headers=_fresh_ip_headers(), timeout=10)
        assert r1.status_code == 201 and r2.status_code in (200, 201)
        d1 = r1.json(); d2 = r2.json()
        assert d1["reference_number"] == d2["reference_number"]
        assert d2.get("duplicate") is True
        CREATED["enquiries"].append(d1["reference_number"])

    def test_honeypot_rejected(self):
        p = _base_payload(company_website="http://spam.example.com")
        r = requests.post(f"{API}/enquiries", json=p, headers=_fresh_ip_headers(), timeout=10)
        assert r.status_code == 400


# ---------- admin catalogue CRUD ----------
class TestCatalogueCRUD:
    def test_create_category(self, admin_headers):
        name = "TEST_Cat_" + uuid.uuid4().hex[:5]
        r = requests.post(f"{API}/admin/categories", headers=admin_headers,
                          json={"name": name, "summary": "QA category",
                                "status": "published"}, timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["name"] == name and data["slug"]
        CREATED["categories"].append(data["id"])
        pytest.cat_id = data["id"]
        pytest.cat_slug = data["slug"]

    def test_create_industry(self, admin_headers):
        name = "TEST_Ind_" + uuid.uuid4().hex[:5]
        r = requests.post(f"{API}/admin/industries", headers=admin_headers,
                          json={"name": name, "overview": "QA industry",
                                "status": "published"}, timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        CREATED["industries"].append(data["id"])
        pytest.ind_id = data["id"]
        pytest.ind_slug = data["slug"]

    def test_create_product(self, admin_headers):
        name = "TEST_Prod_" + uuid.uuid4().hex[:5]
        payload = {
            "name": name,
            "product_code": "TC-QA-001",
            "category_id": pytest.cat_id,
            "industry_ids": [pytest.ind_id],
            "summary": "QA PU product.",
            "description": "Full description for QA.",
            "image_url": "https://example.com/qa.jpg",
            "specifications": [
                {"label": "Hardness", "value": "80", "unit": "Shore A"},
                {"label": "Density", "value": "1.2", "unit": "g/cm3"},
            ],
            "variants": [{"name": "Standard", "detail": "OD 100mm"}],
            "documents": [{"title": "TDS", "url": "https://example.com/tds.pdf"}],
            "featured": True,
            "status": "published",
        }
        r = requests.post(f"{API}/admin/products", headers=admin_headers, json=payload, timeout=15)
        assert r.status_code == 201, r.text
        data = r.json()
        CREATED["products"].append(data["id"])
        pytest.prod_id = data["id"]
        pytest.prod_slug = data["slug"]

    def test_product_appears_on_public_listing(self):
        r = requests.get(f"{API}/products", timeout=10)
        slugs = [p["slug"] for p in r.json()["items"]]
        assert pytest.prod_slug in slugs

    def test_product_appears_in_category_page(self):
        r = requests.get(f"{API}/categories/{pytest.cat_slug}", timeout=10)
        assert r.status_code == 200
        slugs = [p["slug"] for p in r.json()["products"]]
        assert pytest.prod_slug in slugs

    def test_product_appears_in_industry_page(self):
        r = requests.get(f"{API}/industries/{pytest.ind_slug}", timeout=10)
        assert r.status_code == 200
        slugs = [p["slug"] for p in r.json()["products"]]
        assert pytest.prod_slug in slugs

    def test_product_detail_page(self):
        r = requests.get(f"{API}/products/{pytest.prod_slug}", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert len(data["product"]["specifications"]) == 2
        assert len(data["product"]["variants"]) == 1
        assert data["product"]["featured"] is True

    def test_admin_product_search_and_status_filter(self, admin_headers):
        r = requests.get(f"{API}/admin/products?q=TEST_Prod&status=published",
                         headers=admin_headers, timeout=10)
        assert r.status_code == 200
        slugs = [p["slug"] for p in r.json()["items"]]
        assert pytest.prod_slug in slugs

    def test_archive_product_hides_from_public(self, admin_headers):
        r = requests.delete(f"{API}/admin/products/{pytest.prod_id}",
                            headers=admin_headers, timeout=10)
        assert r.status_code == 200
        r2 = requests.get(f"{API}/products/{pytest.prod_slug}", timeout=10)
        assert r2.status_code == 404


# ---------- settings ----------
class TestSettings:
    def test_update_settings_super_admin(self, admin_headers):
        r = requests.patch(f"{API}/admin/settings", headers=admin_headers,
                           json={"contact_email": "qa-contact@example.com",
                                 "contact_phone": "+91 1800 123 456",
                                 "whatsapp_number": "919876543210",
                                 "whatsapp_message": "Hello TrueCore QA"}, timeout=10)
        assert r.status_code == 200, r.text
        pub = requests.get(f"{API}/settings", timeout=10).json()
        assert pub["contact_email"] == "qa-contact@example.com"
        assert pub["whatsapp_number"] == "919876543210"


# ---------- page content ----------
class TestPageContent:
    def test_patch_home_page_section(self, admin_headers):
        g = requests.get(f"{API}/admin/content/home", headers=admin_headers, timeout=10)
        assert g.status_code == 200, g.text
        page = g.json()
        sections = page.get("sections") or []
        if not sections:
            return
        original = sections[0].get("heading")
        sections[0]["heading"] = "QA Heading " + uuid.uuid4().hex[:4]
        new_head = sections[0]["heading"]
        try:
            r = requests.patch(f"{API}/admin/content/home", headers=admin_headers,
                               json={"sections": sections, "status": "published"}, timeout=10)
            assert r.status_code == 200
            pub = requests.get(f"{API}/pages/home", timeout=10)
            assert pub.status_code == 200
            assert any(s.get("heading") == new_head for s in pub.json()["sections"])
        finally:
            # restore original heading so site content stays canonical
            sections[0]["heading"] = original
            requests.patch(f"{API}/admin/content/home", headers=admin_headers,
                           json={"sections": sections, "status": "published"}, timeout=10)


# ---------- RBAC ----------
class TestRBAC:
    @pytest.fixture(scope="class")
    def content_mgr(self, admin_headers):
        u = "qa_cm_" + uuid.uuid4().hex[:5]
        pw = "QaPass!" + uuid.uuid4().hex[:6]
        r = requests.post(f"{API}/auth/users", headers=admin_headers, json={
            "username": u, "email": f"{u}@example.com", "name": "QA CM",
            "password": pw, "role": "content_manager"
        }, timeout=10)
        assert r.status_code == 200, r.text
        CREATED["users"].append(r.json()["id"])
        login = requests.post(f"{API}/auth/login", headers=_fresh_ip_headers(),
                              json={"identifier": u, "password": pw}, timeout=10).json()
        assert "access_token" in login, f"login response: {login}"
        return {"Authorization": f"Bearer {login['access_token']}"}

    @pytest.fixture(scope="class")
    def enquiry_mgr(self, admin_headers):
        u = "qa_em_" + uuid.uuid4().hex[:5]
        pw = "QaPass!" + uuid.uuid4().hex[:6]
        r = requests.post(f"{API}/auth/users", headers=admin_headers, json={
            "username": u, "email": f"{u}@example.com", "name": "QA EM",
            "password": pw, "role": "enquiry_manager"
        }, timeout=10)
        assert r.status_code == 200
        CREATED["users"].append(r.json()["id"])
        login = requests.post(f"{API}/auth/login", headers=_fresh_ip_headers(),
                              json={"identifier": u, "password": pw}, timeout=10).json()
        assert "access_token" in login, f"login response: {login}"
        return {"Authorization": f"Bearer {login['access_token']}"}

    def test_content_mgr_cannot_list_enquiries(self, content_mgr):
        r = requests.get(f"{API}/admin/enquiries", headers=content_mgr, timeout=10)
        assert r.status_code == 403

    def test_content_mgr_cannot_patch_settings(self, content_mgr):
        r = requests.patch(f"{API}/admin/settings", headers=content_mgr,
                           json={"contact_email": "x@y.com"}, timeout=10)
        assert r.status_code == 403

    def test_enquiry_mgr_cannot_create_product(self, enquiry_mgr):
        r = requests.post(f"{API}/admin/products", headers=enquiry_mgr,
                          json={"name": "TEST_blocked"}, timeout=10)
        assert r.status_code == 403

    def test_enquiry_mgr_can_list_enquiries(self, enquiry_mgr):
        r = requests.get(f"{API}/admin/enquiries", headers=enquiry_mgr, timeout=10)
        assert r.status_code == 200


# ---------- enquiry admin flow ----------
class TestEnquiryAdmin:
    def test_list_and_update_status_and_note(self, admin_headers):
        r = requests.get(f"{API}/admin/enquiries", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) > 0
        eid = items[0]["id"]
        # change status
        u = requests.patch(f"{API}/admin/enquiries/{eid}", headers=admin_headers,
                          json={"status": "in_progress", "priority": "high"}, timeout=10)
        assert u.status_code == 200
        # add note
        n = requests.post(f"{API}/admin/enquiries/{eid}/notes", headers=admin_headers,
                         json={"note": "QA internal note"}, timeout=10)
        assert n.status_code == 201
        # detail shows history + notes
        d = requests.get(f"{API}/admin/enquiries/{eid}", headers=admin_headers, timeout=10).json()
        assert any(h["to_status"] == "in_progress" for h in d["history"])
        assert any(nt["note"] == "QA internal note" for nt in d["notes"])

    def test_export_csv(self, admin_headers):
        r = requests.get(f"{API}/admin/enquiries/export", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert "reference_number" in r.text
        # new columns must be present in CSV header
        header = r.text.splitlines()[0]
        assert "city" in header
        assert "enquirer_type" in header


# ---------- public pages (content_defaults) ----------
class TestPublicContent:
    def test_home_hero_blocks(self):
        r = requests.get(f"{API}/pages/home", timeout=10)
        assert r.status_code == 200
        sections = r.json().get("sections") or []
        keys = {s.get("key") for s in sections}
        for k in ("hero", "hero_applications", "hero_materials", "hero_sectors",
                  "offerings", "technology"):
            assert k in keys, f"missing section: {k}"
        hero = next(s for s in sections if s["key"] == "hero")
        # heading may be customised in prior QA runs, so just check subheading unchanged
        assert "High-Performance Advanced Polymer Products" in hero.get("subheading", "")

    def test_about_page_sections(self):
        r = requests.get(f"{API}/pages/about", timeout=10)
        assert r.status_code == 200
        keys = {s.get("key") for s in r.json().get("sections") or []}
        for k in ("overview", "vision", "mission", "philosophy",
                  "manufacturing", "quality", "future"):
            assert k in keys, f"missing about section: {k}"

    def test_technology_page(self):
        r = requests.get(f"{API}/pages/technology", timeout=10)
        assert r.status_code == 200

    def test_sustainability_page(self):
        r = requests.get(f"{API}/pages/sustainability", timeout=10)
        assert r.status_code == 200
        secs = r.json().get("sections") or []
        keys = {s.get("key") for s in secs}
        for k in ("intro", "approach", "focus"):
            assert k in keys
        focus = next(s for s in secs if s["key"] == "focus")
        # Must have 5 bullet lines in body
        bullets = [b for b in focus.get("body", "").split("\n") if b.strip()]
        assert len(bullets) == 5, f"expected 5 focus bullets, got {len(bullets)}"

    def test_directors_three_profiles(self):
        r = requests.get(f"{API}/directors", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert len(items) == 3
        names = {d["name"] for d in items}
        assert "Shubhra Mishra" in names
        assert "Arun Gopal Mishra" in names
        assert any("Sudhir Kumar Mishra" in n for n in names)
        for d in items:
            assert d.get("designation")
            assert d.get("photo_url")
            assert len(d.get("bio", "")) > 50


class TestAuditLogs:
    def test_audit_logs_super_only(self, admin_headers):
        r = requests.get(f"{API}/admin/audit-logs", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["total"] > 0


# ---------- cleanup ----------
def test_zz_cleanup(admin_headers):
    """Archive/delete all test-created resources."""
    for pid in CREATED["products"]:
        requests.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
    for cid in CREATED["categories"]:
        requests.delete(f"{API}/admin/categories/{cid}", headers=admin_headers)
    for iid in CREATED["industries"]:
        requests.delete(f"{API}/admin/industries/{iid}", headers=admin_headers)
    for uid in CREATED["users"]:
        requests.patch(f"{API}/auth/users/{uid}", headers=admin_headers, json={"active": False})
    print("Remaining test enquiries (not deletable via API):", CREATED["enquiries"])
