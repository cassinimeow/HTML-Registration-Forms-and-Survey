# Philippine-Wide Vendor Registration & Disaster Preparedness Form

Lightweight static site for collecting public market vendor registrations and household disaster preparedness surveys. Built with plain HTML, CSS, and JavaScript; integrates with Supabase for data persistence when configured.

## What this repo contains
- `index.html` — main UI and forms
- `style.css` — core (presentation) styles
- `responsive.css` — responsive and print rules (extracted)
- `script.js` — client logic: address PSGC cascade, geocoding, Supabase reads/writes, validation, and map integration

## Quick start (local)
1. Open `index.html` in your browser (double-click) or serve the folder with a static server.
2. Recommended (Python simple server):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Enable Supabase (optional)
The app uses the Supabase JS client if you provide your Supabase project URL and anon key. By default those values are set in `script.js` near the top:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — your project's anon/public key

For production, avoid embedding private keys in client-side code. Use row-level security (RLS), PostgREST policies, or a backend proxy to protect write access.

### Sample table schemas
Run these SQL snippets in the Supabase SQL editor to create the two main tables used by the app.

Market submissions
```sql
create table if not exists market_submissions (
	id uuid default gen_random_uuid() primary key,
	created_at timestamptz default now(),
	full_name text,
	contact text,
	business_name text,
	stall text,
	goods text,
	permit text,
	id_type text,
	id_number text,
	address_street text,
	address_subdivision text,
	address_barangay text,
	address_city text,
	address_province text,
	address_region text
);
```

Disaster submissions
```sql
create table if not exists disaster_submissions (
	id uuid default gen_random_uuid() primary key,
	created_at timestamptz default now(),
	family_name text,
	family_members int,
	risk_level text,
	experienced_disaster boolean,
	experience_description text,
	evacuation_point text,
	has_evacuation_plan boolean,
	evacuation_plan_items jsonb,
	kit_ready boolean,
	kit_items jsonb,
	needs_kit boolean,
	address_street text,
	address_subdivision text,
	address_barangay text,
	address_city text,
	address_province text,
	address_region text
);
```

## Where to configure Supabase credentials
Open `script.js` and find the top where `SUPABASE_URL` and `SUPABASE_ANON_KEY` are defined. Replace those constants with your project's values.

Important: the anon key is public by design but still consider moving write operations behind a backend if you need stricter control.

## Deployment
- This is a static site; you can deploy it to GitHub Pages, Netlify, Vercel, or any static host.
- If you need server-side secrets (e.g., admin keys), deploy a small serverless function or backend to proxy requests to Supabase.

## Notes & Tips
- Responsive styles are in `responsive.css` to keep layout rules separate.
- Section headings use small emoji icons controlled via CSS classes on each `h3` element.
- Address cascading uses the PSGC public API — make sure your users are online for region/province/city/barangay lookups.

## Contributing
- Edit files and test locally. Open a pull request with changes.

## License
Choose a license for your project (MIT is a common choice). This README does not apply a license by default.

