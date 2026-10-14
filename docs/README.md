# Designik Site — Project Documentation

This document is a starting point for developers working on the Designik website and its custom CMS. It reflects the repository structure reviewed on October 14, 2026. For a homepage overview, see [../README.md](../README.md); for the existing CMS implementation log, see [../CMS_PROGRESS.md](../CMS_PROGRESS.md).

## Overview

Designik is a marketing website built from a Figma design, with a database-backed content management system (CMS), admin interface, reusable page sections, forms, blog content, and SEO controls.

### Technology

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Motion / scrolling:** Framer Motion and Lenis
- **Database:** Neon PostgreSQL, Drizzle ORM and Drizzle Kit
- **Email:** Nodemailer with configurable SMTP
- **Deployment:** GitHub-based deployment workflow; check the active hosting provider and environment before deploying

## Repository map

| Path | Purpose |
| --- | --- |
| `src/app/` | Public site and App Router routes, including `admin/`, `api/`, `blog/`, `forms/`, and dynamic `[slug]/` pages |
| `src/components/` | Site layout, homepage sections, widgets and shared UI |
| `src/cms/` | CMS defaults, widgets, site settings, styles, layout and SEO helpers |
| `src/db/` | Drizzle database connection and schema |
| `src/lib/` | Authentication, authorization, email, hosting, payments and shared utilities |
| `src/ai/` | AI-related site modules |
| `drizzle/` | Versioned database migrations |
| `public/` | Static assets, including exported Figma media |
| `scripts/` | Maintenance tools and smoke tests |
| `next.config.ts` | Next.js configuration, image optimization and static-file fallbacks |

## Local setup

1. Install **Node.js 22.12 or later**.
2. Install dependencies with `npm install`.
3. Create a local `.env.local` file. Add the settings required by the features you are using; do **not** commit secrets.
4. Start the development server with `npm run dev`, then open `http://localhost:3000`.

Example environment variable names (replace placeholders with your own values):

```dotenv
# Required for database-backed functionality
DATABASE_URL=postgresql://...

# Configure when testing real email delivery
CONTACT_TO=notifications@example.com
CONTACT_CC=
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=example-user
SMTP_PASS=example-secret
SMTP_FROM="Designik Website <no-reply@example.com>"
```

The example above is not an exhaustive environment schema; check the relevant route or library module for any additional required variables. SMTP is optional for starting the website, but emails cannot be delivered without working mail credentials.

## Useful commands

```bash
npm run dev            # Local development
npm run build          # Production build (Webpack)
npm start              # Start a production build
npm run lint           # ESLint

npm run db:generate     # Generate Drizzle migrations
npm run db:migrate      # Apply database migrations
npm run db:studio       # Open Drizzle Studio

npm run test:posts      # Example CMS smoke test
npm run test:sections
npm run test:forms
npm run test:seo
npm run test:pages
npm run test:builder-ui
```

Additional smoke-test scripts are listed in `package.json`. Most database-backed tests load `.env.local` and require access to a suitable test environment. Review any script before running it against production data.

## CMS and content workflow

The repository includes admin areas for pages, visual page-building, posts, menus, media, forms, users, SEO, global styles, reusable designs, and website settings. The code and existing [CMS progress log](../CMS_PROGRESS.md) describe draft/published content separation, revision history, publishing, and public rendering of CMS pages.

Typical editing sequence:

1. Log in through the authorized admin interface at `/admin`.
2. Edit the relevant page, post, section, form, menu, or site setting.
3. Preview drafts, then publish explicitly when ready.
4. Check the public route and run targeted smoke tests after making changes.

Do not assume that changes saved as drafts are already live.

## QA and deployment checklist

- Run `npm run lint` and `npm run build`.
- Test the changed admin workflow and the matching public page.
- Check mobile and desktop layouts, navigation, forms, and accessibility.
- Confirm SEO titles, canonicals, robots directives, and sitemap output when relevant.
- Verify production environment variables (especially database and SMTP) without exposing their values.
- Apply database migrations only after reviewing them and arranging a rollback/backup plan.
- Confirm the actual deployment target. The repository has a GitHub/Vercel history and Hostinger-specific static-asset fallbacks in `next.config.ts`.
- After deployment, verify public assets, forms, authentication, and relevant pages.

## Known follow-up items

The [CMS_PROGRESS.md](../CMS_PROGRESS.md) file is dated **July 17, 2026**. At that point it listed wider legacy-element editing, production-session persistence checks, and cross-browser/device acceptance testing as remaining work. **These are historical status notes, not verified current defects.** Recheck them before planning new work.

## Documentation maintenance

Update this document when the architecture, setup steps, scripts, or deployment process changes. Keep deployment credentials and other secrets out of GitHub. Use the root `README.md` for the quick project introduction and `CMS_PROGRESS.md` for implementation tracking.
