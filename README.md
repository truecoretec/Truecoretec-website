# TRUECORE TECHNOLOGIES PVT. LTD. — Corporate Website, Catalogue & Enquiry Platform

Advanced Materials. A Stronger Tomorrow. — B2B corporate website, dynamic product catalogue and
enquiry-management platform with a secure admin CMS.

## Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 19 (CRA + craco), React Router 7, Tailwind CSS, SWR, lucide-react, sonner |
| Backend  | FastAPI (Python), Motor (async MongoDB), PyJWT, bcrypt |
| Database | MongoDB (collections documented below) |
| Hosting  | Supervisor-managed services behind a Kubernetes ingress (`/api` → backend:8001, everything else → frontend:3000) |

## Local setup

```bash
# backend
cd backend
pip install -r requirements.txt
cp .env.example .env     # then edit values
sudo supervisorctl restart backend

# frontend
cd frontend
yarn install
cp .env.example .env     # set REACT_APP_BACKEND_URL
sudo supervisorctl restart frontend
```

## Environment variables

Backend (`backend/.env`):
`MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, `PUBLIC_SITE_URL`.

Frontend (`frontend/.env`): `REACT_APP_BACKEND_URL`.

Never commit real credentials. `.env.example` files list every variable with safe placeholders.

## Initial administrator

The super admin is provisioned idempotently on every backend startup from
`ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Passwords are stored as bcrypt hashes.
Current development credentials are recorded in `memory/test_credentials.md`.

To rotate the password: change `ADMIN_PASSWORD` in `backend/.env` and restart the backend.

Additional admin users (roles: `super_admin`, `content_manager`, `enquiry_manager`) are created
from **Admin → Admin Users**. There is no public registration.

## Data model (MongoDB collections)

`admin_users`, `products`, `categories`, `industries`, `directors`, `page_content`,
`media_assets`, `site_settings`, `enquiries`, `enquiry_notes`, `enquiry_status_history`,
`audit_logs`, `login_attempts`, `counters`.

Indexes (created on startup): unique `products.slug`, `categories.slug`, `industries.slug`,
`page_content.slug`, `enquiries.reference_number`, `admin_users.username`, `admin_users.email`;
plus indexes on product status/sort, enquiry `created_at`, `status`, `email` and audit `created_at`.

Specifications, variants and documents are embedded typed arrays on the product document, so each
product type can declare only the technical fields that are actually approved.

## API

Public: `GET /api/health`, `/api/settings`, `/api/pages/{slug}`, `/api/products`,
`/api/products/{slug}`, `/api/categories`, `/api/categories/{slug}`, `/api/industries`,
`/api/industries/{slug}`, `/api/directors`, `/api/sitemap.xml`, `POST /api/enquiries`.

Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`,
`GET|POST /api/auth/users`, `PATCH /api/auth/users/{id}`.

Admin (authenticated, role-checked): `/api/admin/dashboard`, `/api/admin/products`,
`/api/admin/categories`, `/api/admin/industries`, `/api/admin/directors`, `/api/admin/content`,
`/api/admin/media`, `/api/admin/settings`, `/api/admin/enquiries` (+ `/export`, `/{id}`,
`/{id}/notes`), `/api/admin/audit-logs`.

## Security

- JWT access token issued as an httpOnly, `Secure`, `SameSite=None` cookie; `Authorization: Bearer`
  is accepted as a fallback. 8-hour expiry, logout clears the cookie.
- bcrypt password hashing; brute-force lockout after 5 failed attempts per IP+identifier (15 min)
  and an IP rate limit on the login endpoint.
- Public enquiry endpoint: server-side validation, field length limits, honeypot field,
  per-IP rate limit (5 / 10 min) and 10-minute duplicate suppression.
- Role-based access enforced server side on every admin route; explicit allow-lists mean public
  requests can never modify status, role, assignment or other protected fields.
- Enquiry deletion is not exposed; records are retained and products/categories are archived.
- Generic error envelope — no stack traces are returned to clients.

## SEO

Per-page titles, descriptions, canonical URLs, Open Graph tags, `Organization` and `Product`
structured data, `robots.txt` (admin disallowed, `noindex` on admin pages) and a dynamic
`/api/sitemap.xml` generated from published content.

## Known limitations / owner action required

1. **Email notifications are not configured.** Enquiries are stored and shown in the admin inbox;
   `/api/health` and the admin dashboard both report `email_notifications: not_configured`.
   Provide a transactional email provider to enable notification + acknowledgement mail.
2. **File uploads are not enabled.** Media is referenced by URL in the media library; customer
   drawing attachments are a future phase.
3. **Company data pending approval**: logo, verified email/phone/WhatsApp number, address, business
   hours, products, specifications, industries, director profiles and the final privacy wording.
   All are editable in the admin and stay hidden from the public site while in draft.
4. `sitemap.xml` is served from `/api/sitemap.xml` because non-`/api` paths route to the SPA.
   Point search-console submissions at that URL (also referenced in `robots.txt`).
5. Database backups are provided by the hosting platform; document the restore procedure for the
   production MongoDB instance before launch.
