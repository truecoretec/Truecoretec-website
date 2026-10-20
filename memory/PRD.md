# PRD — TRUECORE TECHNOLOGIES PVT. LTD.

## Original problem statement
Build a premium, responsive B2B corporate website, dynamic product catalogue and enquiry-management
platform for TrueCore Technologies Pvt. Ltd., an Indian manufacturer of high-performance
polyurethane (PU) products and engineered material solutions. Identity: tagline *Advanced Materials.
A Stronger Tomorrow.*, positioning *Manufacturers of High-Performance PU Products*. Mandated palette
#003B7A, #10A6D8, #3F434A, #EDEDED, #FFFFFF, #8A8F96. Deliverables: public site + catalogue +
enquiry workflow + secure admin CMS with RBAC, SEO, accessibility, security and documentation.
No invented products, specifications, certifications, capabilities, director details or contact data.

## User choices (confirmed)
- Admin auth: single hardcoded super admin — username `admin`, password `admin@123`.
- Email notifications: **skipped for now** (enquiries persisted in DB only).
- Media: **no file uploads** — images/documents referenced by URL.
- Contact details: left as editable placeholders in admin.
- Catalogue: **starts empty** — no seeded sample products.

## Architecture
- Frontend: React 19 (CRA/craco), React Router 7, Tailwind (brand tokens in `index.css`), SWR,
  lucide-react, sonner. `PublicLayout` + `AdminLayout` route trees.
- Backend: FastAPI split into `core.py` (db/helpers/seed), `auth.py` (JWT + RBAC), `public_api.py`,
  `admin_api.py`, `server.py` (wiring + global error handlers).
- Database: MongoDB — `admin_users, products, categories, industries, directors, page_content,
  media_assets, site_settings, enquiries, enquiry_notes, enquiry_status_history, audit_logs,
  login_attempts, counters`; unique slug/reference indexes created on startup.

## User personas
1. **Procurement manager / design engineer** — assesses technical suitability, submits a quote request.
2. **TrueCore content manager** — maintains products, categories, industries, pages, media.
3. **TrueCore enquiry manager** — works the enquiry inbox, statuses, notes, exports.
4. **Super admin (owner)** — settings, users, audit logs, publishing authority.

## Core requirements (static)
Responsive public site; database-driven catalogue with search/filter/sort/pagination; shared product
detail template with approved-only specifications; industry landing pages; enquiry persistence with
unique reference; WhatsApp CTA; secure server-validated admin with RBAC; SEO foundations;
WCAG 2.2 AA intent; spam/rate-limit protection; no fabricated company claims.

## Implemented (2026-06-11)- **Public site**: Home (hero, about, offerings, categories, featured, industries, technology, why,
  CTA — empty sections hide cleanly), About, Technology, Privacy Policy (CMS-driven), Products
  catalogue with search/category/industry/sort/pagination/empty-reset, category pages, product detail
  (gallery, spec table, variants, documents, related, prefilled quote CTA), Industries list + detail,
  Directors (restrained empty state), Contact, Request a Quote, custom 404, skip link, scroll restore.
- **Enquiries**: validated POST `/api/enquiries` → `TC-YYYY-00001` reference, honeypot, per-IP rate
  limit, 10-minute duplicate suppression, status history seeded, product/industry/source-page context.
- **Admin portal**: JWT cookie+Bearer login (bcrypt, 5-attempt lockout), dashboard metrics from real
  records, products/categories/industries/directors CRUD + archive, structured page-content editor
  with publish/unpublish/preview, media library (URL based), site settings (single source of truth),
  enquiry inbox with search/filters/detail/status/priority/assignment/internal notes/CSV export,
  admin users with 3 roles, audit logs.
- **SEO/security**: per-page meta + canonical + OG, Organization/Product JSON-LD, dynamic
  `/api/sitemap.xml`, robots.txt disallowing `/admin`, noindex admin pages, server-side validation,
  explicit field allow-lists, generic error envelope, README + `.env.example` files.
- **Verification**: testing agent run 1 — 36/36 backend pytest cases passed, all public routes,
  enquiry flow, admin login/pages, mobile menu and responsive checks passed. QA data removed and
  owner defaults restored afterwards.

## Content revisions (2026-06-12)
- Home: new H1 "High-Performance Engineered Polymer Components", new subheading/intro, hero blocks
  APPLICATIONS / MATERIAL PLATFORMS / SECTORS, updated about + offerings ("High-performance Advanced
  Polymer Products") and technology copy.
- About: new intro plus Vision, Mission, Business Philosophy, Manufacturing & Engineering Focus;
  single CTA (Contact Us button removed).
- New `/sustainability` page (intro, guided approach, 5-point sustainability focus) in nav + footer.
- Industries: owner-supplied applications overview image.- Directors: three published profiles (Shubhra Mishra, Arun Gopal Mishra, Flying Officer Sudhir Kumar
  Mishra (Retd.)) with generated neutral placeholder avatars.
- Enquiry form reduced to name, company, email, phone, city, "select who you are" and optional
  requirement; one shared form rendered inline on /contact + /request-quote and as a popup modal from
  every Enquire Now / Request a Quote CTA. Admin inbox/CSV now carry city + enquirer type.
- Technology page rebuilt as a dedicated template (`pages/Technology.jsx`): "Technology &
  Manufacturing" heading, "Building Integrated Polymer Manufacturing Capabilities" subheading, two
  equal unit cards with imagery (Unit 1 Advanced Polymer Moulding, Unit 2 Polyurethane Processing &
  Custom Engineering), Integrated Manufacturing Approach band and the closing statement. Wording uses
  "being developed" / "under development"; no capacity, machinery or certification claims.
- All copy lives in `backend/content_defaults.py` and is editable in Admin → Pages & Content;
  `python backend/apply_content.py` re-seeds the canonical text.
- Iteration 2 testing: 46/46 backend cases and all frontend flows passed; QA data purged and owner
  defaults restored afterwards.

## Known gaps / owner action required
- Contact (2026-06-12): verified details published — primary email enquiry@truecoretec.com, alternate
  truecoretec@gmail.com, phones +91 63948 12646 / +91 76199 32431, CIN U20131UP2026PTC251661 and the
  Lucknow registered-office address (stored in site_settings; new fields `alternate_email`,
  `alternate_phone`, `cin`). Page adds the Registered Office card, Unit 1 (G-37) and Unit 2 (G-38)
  Sandila cards with exact coordinates + "View on Google Maps" links (new tab, noopener noreferrer),
  and an "Our Locations" tabbed embedded map (default Lucknow) with a dynamic "Open in Google Maps"
  link. Enquiry form untouched.
- Navigation renamed: About Us, Industries We Cater, Technology & Manufacturing, Leadership & Team,
  Contact Us. Desktop nav switches to the menu button below 1280px to fit the longer labels.
  Footer now also carries both emails, both phones, the registered office and CIN.
- Directors (2026-06-12): compact 3-up cards (118px circular portraits, short intro, View Profile)
  with an on-page profile modal (720px desktop / ~94% mobile, X + outside-click + ESC close, body
  scroll lock), an "Our Team" row of four functional capability cards and the closing line "One Team.
  One Engineering Vision." Director records gained a `short_intro` field, editable in Admin → Directors.
- `/industries` rebuilt as "Industries We Cater" (2026-06-12): split heading/intro hero, five equal
  industry cards with overlapping circular icons (Railways, Automotive & EV, Industrial, Mobility &
  Metro, Custom Engineering), five alternating detail sections with bullet capability lists, the
  custom-engineering process flow and a dark-blue cross-industry closing band with Explore Products /
  Request a Technical Discussion CTAs. Content lives in page_content slug `industries`.- Email notifications NOT configured (health + dashboard report this explicitly).
- File uploads NOT implemented (media by URL).
- Pending company data: logo, verified email/phone/WhatsApp/address/hours, products, specifications,
  industries, director profiles, final privacy wording, domain.

## Backlog
**P0 (owner input)**: publish verified contact details + logo; create first categories/products/
industries; approve privacy policy.
**P1**: transactional email notifications + customer acknowledgement; object-storage uploads for
images and technical documents (with private customer drawings); enquiry assignment notifications;
dashboard trend charts; slug-change redirects.
**P2**: CRM integration and lead routing; gated technical resources; multi-language; product
comparison; analytics dashboard integration.

## Next tasks
1. Wire a transactional email provider for enquiry notifications + acknowledgements.
2. Enable image/document uploads via object storage (replace URL-only media).
3. Add drawing attachments to the quote form with authorised-only download.
4. Publish the initial approved catalogue (categories → products → industries).

## 2026-06 Global footer rebuild (shared component only)
Rewrote `/app/frontend/src/components/site/Footer.jsx` only — no other file touched.
- Compact premium navy footer: 4 cols desktop / 2 tablet / stacked mobile.
- Company (logo, name, tagline, short polymer description, CIN U20131UP2026PTC251661),
  Explore (8 existing routes; "Leadership & Team" label on existing /directors route),
  Connect (Request an RFQ, Product Enquiry, Vendor / Supplier Enquiry, Research Collaboration,
  Careers — all routed to existing /contact per user choice; no new pages/routes),
  Contact Us (enquiry@truecoretec.com, truecoretec@gmail.com, +91 63948 12646, +91 76199 32431 —
  each individually clickable mailto:/tel:) + "Send an Enquiry →" CTA to /contact.
- Locations strip with divider-separated clickable Google Maps coord links (Lucknow 26.829381,80.865589;
  Sandila G-37 27.106768,80.438754; Sandila G-38 27.106855,80.438616) opening in new tab.
- Plain-text industry strip; bottom bar with © 2026 left, Privacy Policy | Staff Login | tagline right.
- Verified by screenshot at 1920 and 390 widths; no footer overflow.
