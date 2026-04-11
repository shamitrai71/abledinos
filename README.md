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

## Phases

- **Phase 1** ✅ Project scaffolding, config files, folder structure
- **Phase 2** ✅ Extract CSS and JS into separate files
- **Phase 3** ✅ Separate admin panel into admin/index.html
- **Phase 4** ⏳ Replace localStorage with Neon via serverless functions
