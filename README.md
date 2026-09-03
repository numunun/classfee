<div align="center">

# 🏫 Class Management System

**Attendance, meals, fines, and announcements for one high-school classroom.**

Started as a Google Sheet for tracking class fines. Now it runs the room.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

![RLS](https://img.shields.io/badge/RLS-enabled-3FCF8E?style=flat-square)
![Region](https://img.shields.io/badge/region-icn1%20(Seoul)-black?style=flat-square)
![Migrations](https://img.shields.io/badge/migrations-17-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

</div>

---

## What it does

<table>
<tr>
<td width="50%" valign="top">

### 💸 Fines
Late arrivals, cleaning no-shows, and misc penalties — issued by admins, paid by
bank transfer, verified against the statement.

- Due 7 days after issue
- **Doubles every 7 days overdue, capped at 4×**
- Escalating consequences by cumulative total
- Cancel, don't delete — the record survives

</td>
<td width="50%" valign="top">

### 🌙 CIP · evening study
Three sessions a night. Everyone starts *present*; students only flag the ones
they're missing.

- Academy · hospital · special room · other
- Weekly academy schedule auto-fills sessions 2–3
- Mon–Thu only, edits close at 21:00
- Resets to *present* at midnight

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🍚 Meals
Lunch pulled live from the national **NEIS** open API. Dinner isn't published there,
so admins paste in a month at a time.

- Skips to the next school day on holidays
- `~highlight~` syntax for special menus

</td>
<td width="50%" valign="top">

### 📺 Classroom board
A live attendance display for the front-of-room screen. **No login required.**

- Auto-switches session by time of day
- Polls for changes without re-rendering
- Ships a zero-JavaScript build for the ancient browser on the actual device

</td>
</tr>
</table>

<details>
<summary><b>And a few more</b></summary>

<br/>

| | |
|---|---|
| 🔐 **Domain-locked sign-in** | Google OAuth restricted to the school domain. First-time users self-register their name and student number. |
| 📢 **Announcements** | Stay pinned until taken down. Hide without deleting. |
| 🩺 **Diagnostics page** | Env vars, DB functions, RLS state, cron jobs, and live API checks on one screen. |
| 👁 **Student preview** | Admins can view any student's screen — theme and all — read-only, so no action can fire by accident. |
| 🎨 **Per-student themes** | Keyed by student number. Full palette, animated gradients, background watermark. |

</details>

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

<details>
<summary><b>Environment variables</b></summary>

<br/>

| Name | Notes |
|:--|:--|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable key from the same page |
| `NEXT_PUBLIC_SCHOOL_DOMAIN` | Allowed login domain, no `@`. ⚠️ **Empty disables domain checking entirely.** |
| `NEIS_API_KEY` | From [open.neis.go.kr](https://open.neis.go.kr). Server-only — never prefix with `NEXT_PUBLIC_`. |

</details>

<details>
<summary><b>Supabase setup</b></summary>

<br/>

**1. Run the migrations in order** — `supabase/migrations/` 0001 → 0017.
Out-of-order runs fail; later files depend on earlier functions.

**2. Seed the first admin.** RLS blocks non-admins from editing the roster, so the
first one has to go in via SQL. See `supabase/seed_example.sql`.

**3. Enable Google** under Authentication → Providers.

**4. URL Configuration**
- Site URL → the deployed origin
- Redirect URLs → `http://localhost:3000/**`, `https://<domain>/**`

**5. Google Cloud** → Auth Platform → Clients → *Web application*
- JavaScript origins → the app's origin
- Redirect URIs → **the Supabase callback**, `https://xxxx.supabase.co/auth/v1/callback`

> ⚠️ Putting the app's URL in *Redirect URIs* is the single most common setup mistake.
> Google redirects to Supabase; Supabase redirects to the app.

**6. Schedule the overdue job** — enable `pg_cron`, then:

```sql
select cron.schedule('overdue-fines', '5 15 * * *', $$ select public.apply_overdue_fines(); $$);
```

`15:05 UTC` = `00:05 KST`.

</details>

---

## Security model

> RLS is on for **every** table. The app never trusts a role sent from the client.

| Rule | Why |
|:--|:--|
| Sessions in **httpOnly cookies** | `localStorage` is readable by any script on the page |
| Roles **re-read from the DB** server-side | A client-supplied `role: "admin"` means nothing |
| `payment_requests` has **no INSERT policy** | Requests only come from an RPC that computes the amount server-side — the client can't forge a total |
| Admins **can't approve their own** payments | Real money moves through this; self-approval is an audit hole |
| `apply_overdue_fines()` has **EXECUTE revoked** | It's `security definer`; without this a student could double everyone's fines on demand |
| Board data goes through a **`security definer` snapshot** | The public display returns names and statuses only — never emails or fine amounts |

---

## Design notes

<details>
<summary><b>🕐 Time zones — the bug that hides until 9am</b></summary>

<br/>

Supabase and Vercel both run in UTC. Using `current_date` or `new Date().getDate()`
means **the day rolls over at 09:00 KST, not midnight** — so attendance appeared to
"reset" nine hours late, and only someone checking before breakfast would notice.

Everything date-related is pinned to Korea:

DB → public.today_kst()
App → todayISO() · weekdayIndex() · seoulMinutesOfDay()


</details>

<details>
<summary><b>🔗 Ambiguous joins — the query that silently returns nothing</b></summary>

<br/>

`fines` references `students` three times (`student_id`, `created_by`, `deleted_by`).
`payment_requests` references it twice. Write `students(name)` and PostgREST can't tell
which one you meant, so the query **fails silently and returns an empty array** — no
error, no data, no clue.

```diff
- .select("*, students(name)")
+ .select("*, students!fines_student_id_fkey(name)")
```

</details>

<details>
<summary><b>🪟 Modals vs. frosted glass</b></summary>

<br/>

Cards use `backdrop-filter` for the glass effect, and every one of them creates its own
stacking context. A modal rendered inside the page gets its backdrop blur **trapped
inside whichever card it happened to live in** — no amount of `z-index` fixes it.

`src/components/Modal.tsx` portals to `<body>` instead. Bonus: click-outside, Escape,
and scroll-lock come free once it lives at the top level.

</details>

<details>
<summary><b>📺 Supporting a 2018 browser</b></summary>

<br/>

The classroom display runs Opera 51 — Chromium 64. It can't parse `clamp()`, `dvh`,
flex `gap`, or optional chaining, and the app rendered as a black screen. App installs
are locked down by MDM, so the browser can't be replaced.

`/board/[grade]/[classNo]/legacy` is a route handler that returns hand-built HTML:
zero JavaScript, CSS Grid with the old `grid-gap`, `vh` units, `meta refresh` to update.
It still looks reasonably good.

</details>

<details>
<summary><b>🎨 Theming</b></summary>

<br/>

Colors live in CSS variables; `themeCss()` overrides `:root` and is injected from the
root layout so it survives loading states.

Light themes flip text colors with `!important` rules — which means switching *away*
from one needs `DARK_OVERRIDES` to undo them, or you get black text on a black card.
Floating elements pin their colors inline so they opt out entirely.

</details>

<details>
<summary><b>⚠️ Server action errors</b></summary>

<br/>

Next.js redacts thrown messages in production. `throw new Error("이미 등록된 이메일입니다")`
reaches the user as *"An error occurred in the Server Components render."*

Actions that need to explain themselves return a value instead:

```ts
type ActionResult = { ok: true } | { ok: false; message: string };
```

</details>

---

## Project layout

```text
src/
├── app/
│   ├── student/            # what students see
│   ├── admin/              # admin area, role-gated by layout
│   ├── board/[grade]/[classNo]/
│   │   └── legacy/         # zero-JS build for the classroom display
│   ├── preview/[id]/       # admin viewing a student's screen, read-only
│   ├── onboarding/         # first-time self-registration
│   └── auth/callback/      # OAuth callback + domain check
├── components/
└── lib/                    # auth · settings · NEIS · themes · date helpers

supabase/migrations/        # numbered, run in order
```

supabase/migrations/ # numbered, run in order


---

<div align="center">

Built by **[@numunun](https://github.com/numunun)** · Daejeon Daeshin High School

</div>
