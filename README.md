# Abledino — Smart Travel, Brilliant Destinations

A modular Jamstack travel discovery platform built for Netlify.

## Project Structure

```
abledino-project/
├── .github/workflows/       # CI/CD (optional)
├── netlify/functions/        # Serverless functions (secure Neon bridge)
│   └── connect-db.js         # Database connection — secrets stay server-side
├── public/images/            # Local icons, logos, favicon
├── admin/index.html          # Admin dashboard (Phase 3)
├── index.html                # Public homepage
├── app.js                    # Public UI logic (Phase 2)
├── style.css                 # Global styles (Phase 2)
├── netlify.toml              # Netlify build & redirect config
├── .env.example              # Template for local secrets
└── .gitignore                # Keeps .env and node_modules out of Git
```

## Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install Netlify CLI: `npm i -g netlify-cli`
4. Run locally: `netlify dev`
5. Deploy: connect repo in Netlify Dashboard → auto-deploys on push

## Environment Variables (Netlify Dashboard)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_UPLOAD_PRESET` | Unsigned upload preset |
| `FAL_API_KEY` | fal.ai API key (AI image generation) |
| `GOOGLE_PLACES_API_KEY` | Google Places API (New) key — powers autocomplete, place details & text search |

## Phases

- **Phase 1** ✅ Project scaffolding, config files, folder structure
- **Phase 2** ✅ Extract CSS and JS into separate files
- **Phase 3** ✅ Separate admin panel into admin/index.html
- **Phase 4** ⏳ Replace localStorage with Neon via serverless functions


## Shared persistence with Neon

This project now supports shared data across devices through `/.netlify/functions/connect-db`.

### Netlify environment variable
Set this in Netlify before deploying:

- `DATABASE_URL` = your Neon connection string

### What is synced
- countries
- cities
- country pages
- city pages
- city items
- tips
- ads
- settings
- users, including the default superadmin

### Default superadmin
- Email: `esraigroup@gmail.com`
- Password: `super123`

The frontend still keeps a browser copy for fast loading, but it now syncs with Neon so edits made in admin appear on other devices and browsers.


## GitHub and Netlify notes

This package is ready to extract, commit to GitHub, and connect to Netlify.

### Quick start
1. Extract the ZIP locally.
2. Push the extracted files to your GitHub repository.
3. Connect that repository to Netlify.
4. In Netlify, set `DATABASE_URL` before testing admin edits across devices.

### Admin sync status
The admin header now shows one of two states:
- **Shared Neon sync active**: edits should appear across browsers and devices.
- **Browser-only fallback active**: Neon is unavailable, so edits are only saved in the current browser.

Use the refresh icon in the admin header after deployment if you want to re-check the connection.
