# Exercise Demonstration Media: Licensing Research for FitLog

**Purpose:** Find media (video/GIF/image) showing correct exercise form that can legally be bundled into or streamed by a **free, publicly-published Android app** (Play Store, no paywall, optional donate button = still "distributed to the public," not "personal/non-commercial use"). All findings below are sourced from direct inspection of license files, API responses, and repo READMEs on 2026-09-15 — not assumptions. URLs are cited per claim.

---

## 1. free-exercise-db (github.com/yuhonas/free-exercise-db)

- **What it actually contains:** Static **JPG/PNG images**, not GIFs or video. ~800+ exercises, each with a JSON record and 1-2 still images (e.g. `exercises/Alternate_Incline_Dumbbell_Curl/0.jpg`). Confirmed via repo structure and README. [github.com/yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db)
- **License (verified directly):** `LICENSE.md` in the repo is **The Unlicense** (public domain dedication), confirmed via GitHub's API license metadata (`"spdx_id": "Unlicense"`). [LICENSE.md](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md)
- **Attribution required:** No, per the stated license text.
- **Commercial use:** Explicitly yes, per Unlicense text ("commercial or non-commercial, and by any means").
- **⚠️ Important caveat — the license claim is legally shaky:** The dataset is a restructuring of **wrkout/exercises.json** by Ollie Jennings, which itself pulls from the same lineage as **wger**/**Everkinetic**. Querying wger's own API (see §2) shows these same-style images are licensed **CC-BY-SA 3.0 with `license_author: "Everkinetic"`** — a share-alike, attribution-required license, not public domain. Two open GitHub issues on free-exercise-db ask this exact question and **neither has ever received a maintainer answer**: [Issue #2 "License of Images?"](https://github.com/yuhonas/free-exercise-db/issues/2) (opened 2023, unanswered) and [Issue #12](https://github.com/yuhonas/free-exercise-db/issues/12) (opened 2024, unanswered). In other words: someone re-licensed CC-BY-SA-sourced images as "Unlicense" without a clear chain of permission, and the community has flagged this unresolved. Using these images commercially carries real (if probably low-enforcement-risk) legal exposure.
- **Coverage for strength training specifically:** Good breadth (barbell/dumbbell/machine/bodyweight all represented, ~800 exercises), but quality is dated — mostly early-2010s stock-style photos or simple illustrations, inconsistent angles, no motion.

## 2. Wger (wger.de / github.com/wger-project/wger)

- **App code license:** AGPL-3.0-or-later (this only governs the software, not the exercise content). [wger.readthedocs.io](https://wger.readthedocs.io/)
- **Exercise content license:** Separately licensed. Confirmed live via the public API: `GET https://wger.de/api/v2/exerciseimage/` (no auth needed) returns each image with `license`, `license_title`, `license_author`, `license_author_url` fields. Sampling the live endpoint on 2026-09-15 showed `license: 1` = **CC-BY-SA 3.0** as the default (confirmed against `GET https://wger.de/api/v2/license/`, which lists CC-BY-SA 3.0, CC-BY-SA 4.0, CC-BY 4.0, CC0, and ODbL as the five possible per-image licenses used across the dataset). One sampled image (`Narrow-grip-bench-press-1.png`) explicitly lists `license_author: "Everkinetic"`.
- **Attribution required:** **Yes, per-image** — it varies by record (some are CC0 with no attribution needed, most strength-training ones sampled were CC-BY-SA 3.0, which requires attribution + share-alike). You'd need to programmatically read the `license`/`license_author` fields per image and render credit in-app; you cannot apply one blanket license to the whole set.
- **Commercial use:** CC-BY-SA and CC-BY licenses **do permit commercial use** (share-alike only affects derivatives of the image itself, not the app around it). CC0 items are unrestricted. This is the most *honestly documented* source found.
- **Media type:** **Static images only** — confirmed no video endpoint exists (`GET /api/v2/exercisevideo/` returns 404). Images are simple 2-color line-drawing illustrations (see sampled URLs like `wger.de/media/exercise-images/91/Crunches-1.png`), not photos and not motion.
- **Coverage:** 374 images across the catalog (checked via `count` field on `/api/v2/exerciseimage/`), covering most common strength exercises (crunches, bench press variations, etc.) reasonably well, but each exercise typically has only 1 static illustration frame — not a "form demonstration," more an anatomical diagram style. No eccentric/concentric motion is shown.

## 3. Wikimedia Commons

- **What's there:** A dedicated category, [Category:Videos of people demonstrating strength training exercises](https://commons.wikimedia.org/wiki/Category:Videos_of_people_demonstrating_strength_training_exercises), containing **27 videos** as of this check: bench press, incline/dumbbell press, squat, leg press (45° and seated), deadlift, bent-over row, T-bar row, pull-ups, lat pulldown, shoulder press variants, hanging crunches/leg raises, kettlebell farmer walks, EZ-bar/straight-bar curls, and rack/outdoor-gym-equipment demos.
- **License:** Varies **per file**, stated on each file's page — not blanket CC0. Example checked directly: [File:Squat - exercise demonstration video.webm](https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm) is **CC-BY 3.0** (attribution required — "FitnessScape," a YouTube channel that released it under YouTube's now-discontinued CC license option pre-August 2025).
- **Attribution required:** Yes for CC-BY/CC-BY-SA files (the norm here); some Commons files are CC0 but that's not universal — check every file individually.
- **Commercial use:** CC-BY and CC-BY-SA both permit commercial use. Genuinely usable **if you're willing to check and credit each file one by one**.
- **Coverage/quality:** Sparse relative to a 100+ exercise list — 27 videos total, skewed toward compound barbell/machine lifts, essentially nothing for many accessory/isolation or bodyweight movements. Video quality/production varies (they're literally repurposed YouTube uploads). Realistic outcome: you might cover 15-25% of a typical strength-training exercise list this way, with real per-clip attribution bookkeeping overhead.

## 4. Openverse (openverse.org)

- **What it is:** A CC/public-domain media search aggregator (WordPress Foundation project), MIT-licensed software, indexing several hundred million items — but **images and audio only**. Confirmed via Openverse's own documentation: "Currently Openverse only searches images and audio... search for video [is] provided through External Sources," i.e., video search just forwards you to outside search engines/YouTube rather than indexing anything itself. [openverse.org/sources](https://openverse.org/sources) / [Openverse About](https://openverse.org/about)
- **Practical implication for FitLog:** No usable native video/GIF search at all. For static images it would surface some of the same Wikimedia/Flickr-sourced exercise photos already covered in §3, with the same per-item license-checking burden, but does not add net-new *video* content.
- **Coverage:** Not independently useful beyond what Wikimedia Commons already offers; do not treat it as a separate video source.

## 5. YouTube embedding (IFrame API) — a fallback, not an asset

- **Legally allowed?** Yes — embedding via YouTube's official IFrame Player API is permitted under YouTube's Terms of Service and is extremely common in third-party apps.
- **But this is fundamentally different from a licensed, owned asset:**
  - The video stays hosted and controlled by the original uploader. It can be **deleted, made private, region-blocked, or have its monetization/ads changed** at any time, breaking your app's content with zero notice and no recourse.
  - You are not granted any redistribution or download right — you may only display the player pointed at YouTube's own servers, subject to YouTube's branding/UI requirements (their logo, related-video links, etc. must remain intact per their embed ToS).
  - It introduces a live network dependency and third-party ads/tracking inside your app experience, which is a materially different product decision than bundling your own asset.
  - It is **not a substitute for having actual footage** — it's a "reference link that happens to render inline," not something FitLog owns or controls.
- **Verdict:** Fine as a pragmatic, zero-cost stopgap (e.g., "Watch a form demo" button/embed linking to a well-established fitness channel's video for a given exercise), but should be labeled internally as a fallback UX pattern, not listed alongside "licensed media assets."

## 6. Other sources found (verified, not fabricated)

| Source | Finding |
|---|---|
| **wrkout/exercises.json** (github.com/wrkout/exercises.json) | The direct upstream of free-exercise-db. Also Unlicense for the JSON/code. Its README doesn't document image provenance either — same chain-of-title problem as §1. Note: it advertises a **paid commercial version** at wrkout.xyz with "10,000+ images / 3,500+ videos" — confirming that real video coverage for this exercise list exists commercially, just not for free. |
| **exercemus/exercises** (github.com/exercemus/exercises) | Aggregates wger + exercises.json + its own curation. Repo code is MIT, but explicitly states **each exercise carries its own license** in a `license` field and warns "this is NOT ADVICE on how to properly handle these licenses" — i.e., it inherits exactly the same per-item CC-BY-SA/CC0 mix as wger, with no images/video redistributed directly in the repo (JSON only, references external image URLs). Doesn't solve the video problem. |
| **hasaneyldrm/exercises-dataset** ("LogPress" data, github.com/hasaneyldrm/exercises-dataset) | Has real animated GIFs (1,324 exercises) — but they are **© Gym Visual (gymvisual.com)**, used under a permission arrangement specific to that repo's owner. The README itself says reuse is governed by Gym Visual's own Terms & Conditions and you must get your **own license from Gym Visual** to reuse them elsewhere. **Not free for FitLog to redistribute** — this is copyrighted stock content, not an open dataset, despite living in a public GitHub repo. |
| **ExerciseDB API** (github.com/ExerciseDB/exercisedb-api, exercisedb.dev) | Free tier offers 1,500+ exercises with 180p GIFs, but is explicitly **non-commercial use only, with attribution required**; a real commercial license costs **$299-599 one-time**. This confirms the pattern: wherever real GIF/video coverage with good production quality exists, it's normally the same underlying paid stock library (Gym Visual or similar) re-licensed at a price — there is no free, legally clean, commercial-use video/GIF dataset at this quality tier. |
| Government health agencies / university kinesiology depts | Searched specifically; found no CC-licensed video/GIF exercise-demonstration library from a health agency or university that covers general gym strength training (some agencies like NHS/CDC publish exercise *guidance pages* but not licensed reusable video assets for redistribution — did not find a usable hit here, reporting the negative result rather than guessing). |

---

## Comparison Table

| Source | Media type | License | Attribution required | Commercial/app use OK | Strength-training coverage |
|---|---|---|---|---|---|
| free-exercise-db | Static images (JPG) | Unlicense (claimed) — **provenance disputed, likely really CC-BY-SA underneath** | No (per stated license; disputed) | Yes (per stated license); **legal risk from unresolved provenance** | Good breadth (~800 exercises), dated quality |
| Wger API | Static images (line drawings) | Mixed, per-image: CC0 / CC-BY 4 / CC-BY-SA 3 & 4 / ODbL | **Yes, per-image** (varies) | Yes | 374 images, decent breadth, 1 static frame per exercise, not motion |
| Wikimedia Commons | Real video | Mixed, per-file (CC-BY 3.0 seen; others vary) | **Yes, per-file** | Yes (for CC-BY/CC-BY-SA) | Sparse — 27 videos total, ~15-25% of a typical exercise list |
| Openverse | Images/audio only (no real video index) | Mixed (pass-through to sources like Wikimedia) | Varies | Varies | Not additive beyond Wikimedia; no video |
| YouTube IFrame embed | Streamed video (not owned) | YouTube ToS, uploader retains all rights | N/A (not your asset) | "Works" but content can vanish/change anytime; not a real license | Excellent coverage, zero durability guarantee |
| ExerciseDB API (free tier) | GIF | Custom, **non-commercial only** | Yes | **No** (commercial license is $299-599) | Good coverage, but blocked for a public commercial-ish app |
| hasaneyldrm/exercises-dataset | GIF | © Gym Visual, not open | Yes, and needs separate license | **No** | Good coverage, but not legally usable without paying Gym Visual |

---

## Final Recommendation

**Honest conclusion: there is no free, legally clean, redistributable *video* or *GIF* dataset that covers common strength-training exercises at production quality.** Every source with actually good-looking animated content (ExerciseDB, the LogPress/Gym Visual dataset, wrkout.xyz's paid tier) traces back to the same paid stock library (Gym Visual) and is **not free for a published app**, even a free one with a donate button — "free to the end user" does not make your use of their content "non-commercial" in their license terms.

Given the no-budget constraint, the least-bad realistic path is a **hybrid, tiered approach**:

1. **Primary: Wger's API images** (`wger.de/api/v2/exerciseimage/`) as your default form-reference visual. It's the *only* source here with transparent, machine-readable, per-item licensing (`license`, `license_author` fields) that you can defensibly comply with — pull the exercise's illustration, store the license/author string alongside it, and render a small "Illustration: Everkinetic / CC-BY-SA 3.0" (or CC0, etc., whatever that record says) credit line in an exercise-detail screen or an "Image credits" settings page. This is static, not motion, but it's legally sound and zero-cost, with decent (374-image) strength-training coverage.
2. **Supplement: Wikimedia Commons' 27 strength-training videos** wherever an exercise happens to be covered — same per-file attribution discipline (check each file's own license page, most seen were CC-BY 3.0). This gets you real video for maybe a fifth of your exercise list.
3. **Fallback for everything else: an optional "Watch a demo" YouTube embed link** per exercise (IFrame API), clearly framed in your own UI as an external reference, not a bundled asset — accept that it can break/disappear and design for that gracefully (e.g., hide the button if the linked video 404s, rather than the app breaking).
4. **Avoid free-exercise-db and ExerciseDB's free tier** for a *published* app: the former has an unresolved licensing paper trail (two years of unanswered GitHub issues asking the exact question you're asking), and the latter explicitly forbids the commercial/public-distribution use case FitLog is about to enter.
5. **Do not use hasaneyldrm/exercises-dataset or any Gym-Visual-derived GIF set** — those are outright copyrighted stock content masquerading as an "open dataset" on GitHub; using them without paying Gym Visual is a real infringement risk, not a gray area.

If actual per-exercise *video* demonstrations matter enough to the product, the only way to get them cheaply (not free) is the ExerciseDB one-time commercial license ($299-599) or Gym Visual's own licensing — worth flagging to the developer as the realistic minimum spend if video quality becomes a priority later, versus accepting static-illustration-plus-YouTube-fallback as the $0 launch posture.

**Confidence:** High on the factual/license findings (all directly verified against LICENSE files, live API responses, and repo READMEs, with source URLs cited above). Medium on "nothing better exists" — I searched broadly (government/university sources, aggregators, forks) and found nothing additional, but new open datasets could appear over time; this is a snapshot as of 2026-09-15.
