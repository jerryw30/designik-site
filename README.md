# Designik — Creative Agency Website

The Designik marketing site, built one-to-one from the Figma design.
Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Lenis smooth scroll.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Build for production:

```bash
npm run build
npm start
```

## Sections (top → bottom)

Nav · Hero · Stats bar · About intro · Services (bento) · We Drive Your Brand
(accordion) · Experience (statue + floating pills) · Portfolio banners · Meet Our
Team · Testimonials · Our Interactive Design · Footer + newsletter. The orange
**Designik Agency** marquee recurs between sections, exactly as in the design.

## Contact / newsletter form

The footer newsletter posts to `POST /api/contact`, which emails submissions to
`CONTACT_TO` (default **designguyluke@gmail.com**).

To send real email, copy `.env.example` → `.env.local` and fill in SMTP creds
(Gmail App Password, Resend, Mailgun, etc.):

```
CONTACT_TO=designguyluke@gmail.com
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Designik Website <no-reply@designik.agency>"
```

Without SMTP set, submissions are validated and logged to the server console
(nothing is lost) — so the form works in dev and won't error before you go live.

## Deploy (Vercel)

1. Push this folder to a Git repo.
2. Import it in Vercel (framework auto-detected as Next.js).
3. Add the `SMTP_*` / `CONTACT_TO` env vars in Project → Settings → Environment Variables.
4. Deploy.

## Assets & fonts

- Images live in `public/figma/` (exported from the Figma file).
- Fonts: **Oswald** (display), **Inter** (body), **Akshar** (marquee) via `next/font`.
- Brand colours/tokens are defined in `src/app/globals.css` (`@theme`).
- `scripts/` holds the one-off asset-fetch / screenshot helpers used during the build.
