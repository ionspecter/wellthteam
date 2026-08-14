# WELLTH Team — Member Login & Tools

Adds real member accounts to wellthteam.com using Cloudflare Pages Functions + D1.
Everything under `/members/*` is locked behind login automatically.

## What's in here

```
index.html                     ← your homepage, with a "Member Login" button added
functions/
  _auth.js                     ← shared password + session helpers
  api/
    login.js                   ← POST /api/login
    logout.js                  ← POST /api/logout
    me.js                      ← GET  /api/me   (who's logged in)
    register.js                ← POST /api/register  (admin-only, adds a member)
  members/
    _middleware.js             ← gates every page under /members/*
    api/courses/
      index.js                 ← GET  /api/courses          (list topics)
      [id].js                  ← GET  /api/courses/:id       (topic + its videos)
    api/admin/
      courses.js                ← POST /api/admin/courses    (admin-only: add a topic)
      lessons.js                ← POST /api/admin/lessons    (admin-only: add a video to a topic)
public/
  members/
    login.html                 ← login screen
    dashboard.html              ← tool launcher, greets member by name
    courses.html                ← Udemy-style topic grid ("Facebook Ads Masterclass", etc.)
    course.html                 ← video list + player for one topic
schema.sql                     ← D1 table definitions (members, sessions, courses, lessons)
```

Your actual tools (background remover, catalog maker, poster maker) go in
`public/members/tools/` — once you drop them there, they're protected by
the same login automatically, no extra code needed.

## One-time setup

1. **Create the database**
   ```
   wrangler d1 create wellthteam-db
   ```
   Copy the `database_id` it prints.

2. **Bind it to your Pages project** — in the Cloudflare dashboard:
   Pages project → Settings → Functions → D1 database bindings
   → Variable name: `DB` → select `wellthteam-db`.

3. **Run the schema**
   ```
   wrangler d1 execute wellthteam-db --file=./schema.sql --remote
   ```

4. **Set your admin key** — Pages project → Settings → Environment variables
   → add `ADMIN_KEY` = some long random string (this is what lets *you* add
   members; nobody else can create an account).

5. **Deploy** — push this folder to the same GitHub repo/Pages project as
   your current site (or drag-and-drop via `wrangler pages deploy`).

## Adding a team member (you do this, not them)

```bash
curl -X POST https://wellthteam.com/api/register \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -d '{
    "name": "Jelo",
    "email": "jelo@example.com",
    "password": "TempPassword123",
    "tier": "standard",
    "reseller_tag": "JELO"
  }'
```

Tell them their email + temp password. (A self-serve "add member" admin
page is a nice v2 — happy to build that when you're ready, so you're not
running curl commands from your phone.)

## Adding a masterclass (topic) and its videos

Upload each video to YouTube as **Unlisted** (not Private — Unlisted lets it
play embedded; Private wouldn't work here). Grab the 11-character ID from
the URL, e.g. `https://youtu.be/dQw4w9WgXcQ` → `dQw4w9WgXcQ`.

1. Create the topic:
   ```bash
   curl -X POST https://wellthteam.com/api/admin/courses \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: YOUR_ADMIN_KEY" \
     -d '{"title":"Facebook Ads Masterclass","description":"Everything for running your first campaign."}'
   ```
   This returns an `id` — that's the `course_id` you use next.

2. Add each video to it:
   ```bash
   curl -X POST https://wellthteam.com/api/admin/lessons \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: YOUR_ADMIN_KEY" \
     -d '{"course_id": 1, "title":"Lesson 1: Setting up your Business Manager", "youtube_id":"dQw4w9WgXcQ", "duration":"12:04", "sort_order":1}'
   ```
   Repeat per video, bumping `sort_order` (1, 2, 3…) so they play in the
   right order.

Members reach it from the dashboard → "Browse Masterclasses" → click a
topic → click any video in the sidebar to play it. It's all behind the
same login as the tools, so logged-out visitors never see the list or the
videos.

**Worth knowing since it's Unlisted YouTube, not Cloudflare Stream:** if a
member copies a video's actual YouTube URL out of the page source and
sends it to someone outside the team, that person can watch it — being
logged into wellthteam.com is what gates *finding* the video, not the
video file itself. Fine for an internal team library; if this ever becomes
paid or public-facing content, revisit Cloudflare Stream for real
per-request access control.

## Homepage teaser ("latest 2 masterclasses")

`index.html` now has a `#preview` section between the offer list and the
join form. It calls a **public** endpoint —
`functions/api/courses/latest.js` — which is deliberately not behind
login, but only ever returns the 2 newest topics' title/description/video
count. It never returns `youtube_id`s or lesson content, so the videos
themselves stay members-only even though this one endpoint is open.

Each card links to `#join`, which is your existing FormSubmit lead form.
The workflow is:

1. Visitor sees 2 real masterclass topics on the homepage, locked
2. Clicks "Join free to watch" → scrolls to the join form → submits
3. You get the email lead (as you do today)
4. You create their member account with the `curl` command above and
   reply with their login

That last step is manual for now — same as your other lead flows. If lead
volume grows, a natural next step is auto-creating a member account
straight from the form submission instead of you running `curl` each
time — flag it if you want that built.

## Team Anthems (motivational audio player)

Live on the homepage now — a "Team Anthems" section right after the hero,
public, no login needed, restyled to use the site's own colors/fonts
directly (same `--gold`, `--leaf`, `--display`/`--body`/`--quote`
variables as the rest of `index.html`) so it never drifts from the site
theme even if you tweak the palette later.

**Where audio/thumbnail files go — the convention going forward:**

```
assets/audio/
  <song-slug>.mp3              ← the track (Suno export)
  <song-slug>-cover.jpg        ← square cover image, 1000×1000+ recommended
  lyrics/
    <song-slug>.txt            ← plain text, LRC-style timestamps (see below)
```

This zip already includes one real song set up and working:
`assets/audio/galaw-benta.mp3`, `galaw-benta-cover.jpg`, and
`lyrics/galaw-benta.txt` — copy the whole `assets/audio/` folder into your
repo as-is.

**Adding your next song:**

1. Drop the mp3 and a square cover into `assets/audio/`, using the
   `<song-slug>` naming pattern above.
2. Write (or paste from Suno, if it gives you one) a lyrics file into
   `assets/audio/lyrics/<song-slug>.txt`, one line per lyric:
   ```
   [00:12.40]Unang linya ng kanta
   [00:16.90]Pangalawang linya
   ```
   Minutes:seconds.hundredths. Don't have exact times yet — ship rough
   guesses and adjust after listening; every line is click-to-seek so
   it's fast to eyeball-check live on the site.
3. In `index.html`, find the `PLAYLIST` array inside the
   `<!-- TEAM ANTHEMS -->` script block and add a new entry (there's a
   commented-out example already sitting right there to copy).
4. Commit and push — Cloudflare Pages deploys automatically.

**Keep each mp3 under 25MB** (Cloudflare Pages' per-file limit) —
128–160kbps is plenty for a vocal/motivational track and keeps load times
fast on mobile data.

## Notes

- Sessions last 14 days, stored in D1, cookie is `HttpOnly` + `Secure` —
  can't be read or stolen via JS/XSS.
- Passwords are hashed with PBKDF2-SHA256 (100k iterations), never stored
  in plain text.
- The dashboard passes each member's `reseller_tag` to tool pages as a
  `?reseller=` query param. Catalog Maker v4 doesn't read that param yet —
  a ~5 line JS addition to auto-select the reseller dropdown on page load
  is a quick follow-up once this is live.
- `register.js` is intentionally not public signup — only callable with
  your `ADMIN_KEY`. Nobody can create their own account.
