# 🦃 Thanksgiving Machine

The family's Thanksgiving food-prep app. One shared link, no logins, live sync between every phone and tablet.

- **Prep dashboard**: countdown to dinner, a "do now" list, shared timers with a gobble alarm, and a day-by-day timeline with one lane per oven, stovetop, fryer, and so on. It warns you when two oven dishes need different temperatures at the same time.
- **Recipes**: 3 options per dish (❤️ = family recipe from the sheet). The option you pick drives the schedule and the grocery list.
- **Groceries**: built automatically from the picked recipes, with amounts added up across dishes and grouped by store (Sam's, Meijer, Fruit Mkt, On hand). Check items off live while you shop.

All times are shown in **Central time** (`TZ` in `src/lib/format.ts`).

## Stack

React + Vite + TypeScript, Supabase (Postgres + Realtime), deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `main`.

## Develop

```sh
npm install
npm run dev          # http://localhost:5173/ThanksgivingMachine/
npm run build
```

## Data

- Schema: `supabase/migrations/`
- Seed (menu, cooks, recipes, chores, extra grocery items): `seed/data.mjs`
- `npm run seed` upserts the seed data and keeps the family's picks and check-offs.
- `npm run seed -- --reset` also clears picks, check-offs, and timers (for a fresh year).

Recipe steps are timed in minutes relative to dinner, so changing dinner time in the app moves the whole plan.

**Security note:** the Supabase publishable key in `src/config.json` is public by design. Anyone with the link can view and edit, so don't post the link publicly.
