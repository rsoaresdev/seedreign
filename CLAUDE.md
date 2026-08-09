# Seedreign — Project Bible

## 0. What it is (30-second summary)
Seedreign is a free-to-play, territory conquest strategy .io game for browser and mobile (mobile-first). It is the "Wordle of conquest": every day ONE new procedural world is born (the same seed for everyone), which shifts mid-game, and at the end, you share your results in an emoji grid. It is played ASYNCHRONOUSLY (no waiting, no lag), featuring a light roguelike-style card draft. It monetizes ONLY through cosmetics and ads — NEVER pay-to-win.
**Positioning:** The genre (OpenFront.io ~225k daily players, Territorial.io) is proven to be addictive, but the leaders are exclusively real-time, with fixed maps and no meta-progression. Seedreign fills the void: asynchronous + daily seed + living map + roguelike progression, mobile-first.

---

## 1. Lore and Setting
*   The world shattered. What remained was the World Seed. Since then, reality REBORN at every dawn (the "Sowing") and UNRAVELS at dusk (the "Collapse").
*   The player is one of the SEEDED: immortal commanders who persist between worlds. Worlds die; the legend of the Seeded remains.
*   The Seeded belong to HOUSES (factions with banners).
*   Each month is an ERA (season) featuring a new theme, content, and ranked reset.
*   **Tone:** Dark, modern, epic but clean and legible. Never childish.

### Game Objective (One Sentence)
> "Dominate today's world before it collapses at dusk, and build the legend of your Seeded across the Eras."

*   **Short-term:** Win today's challenge and the daily victory condition.
*   **Medium-term:** Rank up in the current Era and complete your collection.
*   **Long-term:** Enter your House's history and the all-time leaderboard.

### How the Fiction Justifies Each Mechanic
*   **Reborn at dawn:** New procedural world per day (daily seed), identical for everyone.
*   **You are immortal, worlds are not:** Progression persists (rank, collection, cosmetics, House) = your profile.
*   **The world is unstable:** Live events (rivers flood, faults split land) and the final Collapse that shrinks the map.
*   **The Sowing changes over time:** The Eras (monthly seasons).

---

## 2. What the Player Does (Core Gameplay)
**Base:** Territory conquest in the style of OpenFront/Territorial — you expand your color across the map, using a slider that divides your army between ATTACK and DEFENSE; population/troops grow with controlled area (diminishing returns near the cap, so expanding pays off more than hoarding).
It is NOT card spam. Victory comes from SEVEN overlapping layers of decision-making:
1.  **Timing and ratio:** When to expand vs. consolidate; what % of the army you commit to each attack.
2.  **Terrain and positioning:** Using chokepoints, rivers, and mountains from the seed; a good defense line is worth twice the troops.
3.  **Commander roles:** 1 ACTIVE ability with aiming and cooldown (e.g., Charge, Bombardment, Wall, Redeploy fleet) + 1 PASSIVE. These are sidegrades (different playstyles), never pure power.
4.  **Map interactions:** Rushing for treasures/chests, clearing neutral camps (PvE), capturing landmarks/wonders that provide buffs. Costs time and exposure.
5.  **Reacting to events:** The map changes several times per game; adapting in seconds separates the good from the great.
6.  **Economy:** Where you invest: cities (population), ports (gold/fleet), relic forges.
7.  **Cards and relics:** The strategic layer; enhances the other 6, does not replace them.
**Relics:** HORIZONTAL activators with trade-offs ("boss relic" style from Slay the Spire), never sheer number bonuses. Rewarded in "choose 1 of 3" drafts, not blind luck.

---

## 3. Main Mode — Daily Challenge
*   **Format:** Same seed for everyone; lasts 7 to 25 minutes; asynchronous against smart bots (3 levels) and the "ghosts" (replays) of friends and rivals. No waiting, no netcode.
*   **Draft:** Starts with a DRAFT: pick 3 out of 6 order cards offered that day (identical for everyone).
*   **Rotative Win Condition (changes daily):** Conquest (most territory at dusk), Domination (eliminate rivals), Relic Hunt (most relics at Collapse), Blitz (reach X% in the fewest turns), Last Banner (survive the Collapse), Wonders (control landmarks), Asymmetrical (each player has a different secret objective).
*   **Multi-dimensional Score:** Points for territory, speed, treasures, objectives/wonders, style (minimal casualties, perfect defense, comeback), and surviving events. There are always multiple strategies to reach the top.
*   **Daily Decree:** 1-2 modifiers for the day.
*   **End Screen:** Score, ghost comparisons, spoiler-free shareable EMOJI GRID, and league points.

---

## 4. Events — World Pulses (occur throughout the game, not just once)
Every ~2-4 minutes the unstable world reacts. A game has 3 to 6+ Pulses, and ALWAYS ends in the Collapse. Dictated by the seed → identical for everyone, at the exact same moment.
*   **Terrain:** River flood, earthquake splitting a continent, eruption denying a zone, ice creating land bridges.
*   **Opportunity:** A "vault" opens (run!), gold rush in a region, a relic falls from the sky.
*   **Threat:** Monster/raider incursion (PvE), plague zone, storm closing the sea.
*   **Twist:** Fog descends (vision), borders shift, bounty on the leader (anti-snowball), revolt in overextended lands.
*   **The Collapse (endgame):** The world unravels from the edges — the playable zone shrinks (battle-royale style), forcing a final confrontation. Guarantees a climax, acts as a free rubber-band, and keeps games within 7-25 mins.

---

## 5. World Generation
*   **Seeded:** Simplex noise (land/sea) + Voronoi/Poisson-disk + Lloyd relaxation (regions). Everything stems from ONE integer seed → reproducible map (replays, ghosts, free bug reports).
*   **Fairness:** Spawns with rotational symmetry + guaranteed minimum distance + "generate-measure-reject" (rerolls unbalanced maps). Random yes, unfair no.
*   **Life:** The seed schedules the Pulses (1-2 key events per game).

---

## 6. Anti-Repetition (never the same combination every day)
*   **Daily Decrees (modifiers)** from a large pool: "double relics but enemies +50%", "permanent fog", "abilities at half cost but slow recharge", "treasures everywhere guarded by elites", etc.
*   **Rotative win condition** (see above).
*   **Rotative draft pool** — the cards offered change.
*   **Featured/banned cards** per week (meta rotation).
*   **Eras (seasons):** Every month, new theme + cards + relics + Houses + ranked reset.

---

## 7. Game Modes
*   **Daily Challenge** — 7-25 min, asynchronous, same seed, leaderboard. (MAIN)
*   **Blitz / Quick Play** — 3-5 min, random seed, casual, vs bots + ghosts.
*   **Ranked** — variable, asynchronous in v1 and real-time later; ladder + seasons; rotating pool per Era.
*   **Weekly Events** — scaling difficulty with stacked modifiers; generous rewards.
*   **Skirmish vs Bots** — offline, training, choose difficulty + Decrees.
*   **Forge (custom map)** — create a map (seed/size/decrees) and share via code with friends.
*   **Co-op vs Collapse (phase 2)** — team against the world (PvE).
*   **Endless Run (phase 2)** — roguelike: chain games with scaling relics (the deep meta).
*   **Live Real-Time (phase 4)** — OpenFront-style lobbies, many players on the same map.

---

## 8. Economy and Fairness (CENTRAL RULE: The fairness firewall)
You can sell cards AND be bulletproof regarding pay-to-win, with one non-negotiable rule: COMPETITIVE surfaces (Daily Challenge and Ranked) are SKILL-CAPPED — money never buys an advantage there. Money buys cosmetics, collection breadth, and convenience, which live in casual modes and the profile.
**How the daily remains 100% fair:**
*   Uses a POOL PROVIDED BY THE SEED, not your collection: everyone gets the same cards/relics for the draft that day.
*   An F2P and a "whale" start exactly the same. Only skill decides.
*   RULE: The daily NEVER draws from your owned collection.
**How ranked remains fair:**
*   Rotating pool per Era (curated subset that changes every season).
*   Matchmaking by collection size (Marvel Snap model).
*   ZERO "card levels" that add stats (the fatal Clash Royale trap).
**The 4 rules that make "buying cards" fair:**
1.  **Horizontal cards** — a new card is a new OPTION, never a better stat block. Strong and simple effects = commons; rarity is for the situational.
2.  **Everything earnable by playing** — deterministic and directed acquisition (craft the card you want), with duplicate and bad luck protection.
3.  **Weekly purchase limit** — gems buy wildcards, but only N per rarity per week. A whale cannot buy the meta in one day.
4.  **Competitive neutralizes collection** — since daily/ranked are leveled, breadth is only felt in casual modes and the profile.
**Two Currencies:**
*   **COINS (soft, earned):** Faucets = daily challenge, wins, event clears, ranked milestones, quests (with diminishing returns). Sinks = crafting cards, event tickets, light cosmetics, re-rolls.
*   **GEMS (hard, bought with real money):** Cosmetics, Era Pass, wildcards with a weekly cap, convenience (extra slots, coin boost).
**Money CAN buy:** Cosmetics, Era Pass, wildcards (with cap), faster collection breadth, convenience.
**Money NEVER buys:** Stats/card levels, competitive-exclusive cards, unlimited card purchases, advantages in daily or ranked.
**Era Pass:** Two tracks (free + premium); premium mostly cosmetic, ~$10, ~80-100 tiers, returns enough gems to buy the next pass (self-funded). No "filler".
**Anti-pay-to-win checklist (NEVER do):** Card stats/levels tied to spending; the daily drawing from the collection; buying cards without a weekly cap; sellable power only for money; removing a fairness mechanic post-launch; giving too many coins early and cutting them off midway.

---

## 9. Ranked, Leagues, and Eras
*   **Daily:** Daily leaderboard (same seed) that resets at midnight; feeds the weekly league.
*   **Weekly:** Weekly league (sum of daily percentiles) + harder Weekly Events.
*   **Era (monthly):** Season leaderboard + ladder with soft-reset. Exclusive rewards (cosmetics, titles, coins).
*   **Tiers:** Bronze, Silver, Gold, Platinum, Diamond, Legend. Matchmaking by skill and collection breadth. Rewards per percentile bands (top 50% get something).
*   **Weekly Events:** Heat (Hades) / Ascension (Slay the Spire) model — increasing difficulty with stacked modifiers, rewards per level redeemable once. It is PvE/seed, no risk of unfairness — the ideal place to be generous.
*   **Optional:** "Snap" style betting/bluffing mechanic (betting ranking points on a turn) — skill, not money.

---

## 10. Game Content
*   **Commanders:** Each with 1 active (aim+cooldown) + 1 passive; sidegrades, not power. In the daily, the commander is provided.
*   **Houses/Banners:** Identity + cosmetics + slight asymmetry.
*   **Order Cards (examples):** Expand, Blitz, Fortify, Landing (naval), Sabotage, Storm-Caller, Nuke. Horizontal.
*   **Relics:** Horizontal with trade-offs; earned in-game (elites, chests, events), choose 1 of 3. Only relic skins are sold.
*   **Treasures/chests/wonders/neutral camps:** Risk/reward nodes on the map.
*   **Structures and economy:** Cities (population), ports (gold/fleet), relic forges; resources = gold and population/troops.

---

## 11. Cosmetics (What is sold) — visibility = #1 conversion predictor
Territory colors and patterns (seen by everyone on the map), flags/coats of arms, board/biome themes, emotes/pings/victory animations, card/commander/relic skins, name effects, and the seasonal Era Pass that wraps it all together.

---

## 12. Social and Profile
*   **Seeded Profile:** House/banner, level, rank and title, stats, badges, collection, cosmetics, match history, best dailies, daily streak.
*   **Friends:** Add via code/username; friends-only leaderboard in the daily; view/race against their ghosts; challenge to Forge maps; private lobbies.
*   **Houses/Clans (phase 2):** Join a House, leaderboards, and weekly House "wars".

---

## 13. Target Audience and Design Principles
*   **Mobile-first:** Portrait, gestures, thumb-controlled; runs on low-end phones.
*   **Short sessions:** 3-25 min. Zero friction: one click, no download or account needed to start.
*   **Addictive BUT ethical:** Rewards every session, doesn't punish anyone for leaving, SELLS IDENTITY AND NEVER POWER. No dark patterns (rule, not a suggestion).
*   **Target Metrics:** D1 above 35-40%, D7 above 10-15%; paying conversion 2-8%; combined target ARPDAU $0.05-$0.20.

---

## 14. Tech Stack (Complete)
*   **Site/landing/profile/login:** Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, shadcn/ui, Motion (motion.dev), GSAP + ScrollTrigger, Lenis, next-intl (i18n: default English + pt), deployed on Vercel.
*   **The Game (the canvas):** Vite + TypeScript + PixiJS v8, with territory rendered as a TEXTURE (not sprite per tile) and "dirty-rects" to run on weak phones.
*   **Simulation:** A shared `/core` package in TypeScript, DETERMINISTIC (integer/fixed-point math, seeded PRNG, turn state hashing) — runs identically on client and server.
*   **Backend:** Supabase (Postgres + Auth + Edge Functions) for daily seed, scores, replays, leagues, cosmetics, friends, profile, waitlist.
*   **Map Generation:** Seeded simplex + Voronoi/Poisson + Lloyd (pre-computed on server, distributed as a seed).
*   **Real-time (future phase):** uWebSockets.js with authoritative lockstep on Hetzner (sends only intents; minimal bandwidth).
*   **Mobile packaging:** PWA + Capacitor for App Stores.
*   **ARCHITECTURE:** SINGLE DOMAIN, path-based. seedreign.io (landing), seedreign.io/play (the game), seedreign.io/login and /profile (auth+profile), Supabase for data. NO subdomains for now (only in the future for regional real-time servers, docs, status).
*   **Costs:** The asynchronous model is almost free (only Supabase, ~$0-15/month for thousands of DAU). Real-time fits in ~$15/month at launch (1 Hetzner CX22/CX32 machine).

---

## 15. Brand and Visual Identity
*   **Name:** Seedreign.
*   **Palette:** Background #0a0e16, panels #121a28, gold #f6b73c (highlight/CTA), teal #43c7bd (secondary), violet #b48cf0 (accent/lore), text #e7eef7, faded #9db0c7.
*   **Tone:** Epic, modern, clean, legible; no clutter. Typography: strong display for titles + clean sans for body.
*   **The big action button (gold, glowing):** "PLAY" in English (default) and "JOGAR" in Portuguese (via i18n).
*   **The daily sharing grid** has its OWN identity (custom colors/emojis) — never copy Wordle's name/visuals (NYT hunts down clones).

---

## 16. Monetization and Business
*   **Free-to-play, web first:** Self-host on own domain + CrazyGames for discovery (NOT Poki — requires exclusivity which clashes with the daily hub).
*   **Revenue:** Self-hosted ads (Playwire/AdinPlay) + rewarded video + cosmetics + Era Pass. Free on Steam and mobile cross-play later.
*   **Benchmarks:** Ads only ~$0.005-$0.03 ARPDAU; well-executed hybrid ~$0.05-$0.20; paying conversion 2-8%.
*   **Distribution is power-law:** Plan for the base case, build the systems that capture the upside if it goes viral.

---

## 17. Go-To-Market (GTM)
*   It's a grind, but the game is structurally advantaged (daily shareable loop + .io genre that goes viral via creators).
*   Host the daily on your own domain (own the data and shares) + CrazyGames as an amplifier.
*   **Channels:** Reddit (r/WebGames, r/playmygame — playable link + GIF, 10:1 rule), Discord from day 1, small/medium streamers (personalized email, instant game link, no "free" or URL shorteners), TikTok/Shorts/Reels (daily clips of the "disaster that turned the game around", 3-5+/week), Product Hunt, and a "Season 0" with a leaderboard prize.
*   **Engine:** The spoiler-free grid (copy to clipboard), streaks, comparing with friends, same seed for everyone.
*   The game creator already does #BuildInPublic — leverage this from the very first prototype.

---

## 18. Roadmap / Phasing (Don't Drown)
*   **Phase 0 (weeks 1-2):** Procedural map engine + conquest loop + 1 Pulse + the Collapse, in single-player. Question: "Is it fun and skill-based in 5-15 mins?"
*   **Phase 1 (weeks 3-6):** Daily Challenge MVP — daily seed + 1 win condition + 1 Decree + score + leaderboard + shareable grid + bots + ~3 base cards and relics. Self-host + CrazyGames + Discord.
*   **Phase 2 (month 2-3):** Depth and retention — more conditions/Decrees/Pulses; commanders+roles; coin economy + collection with the firewall; weekly leagues; ghosts; profile + friends.
*   **Phase 3 (month 3-5):** Monetization and scale — gems + cosmetics + Era Pass; ranked + seasons; Weekly Events; Forge; mobile wrap (Capacitor); Free Steam; Season 0.
*   **Phase 4 (month 6+):** Live real-time (Hetzner) + cross-play; Houses/clans; Co-op; Endless Run.
*   **Anti-scope-creep RULE:** The MVP is 1 win condition, 1 Decree, ~3 cards, 1 Pulse + the Collapse, and bots. Everything else is v1.1+.

---

## 19. Glossary
*   **Seedreign:** The game.
*   **Seeded:** The player (immortal commander).
*   **Sowing:** The daily rebirth of the world.
*   **Collapse:** The end of the day / the shrinking zone in the endgame.
*   **Era:** The monthly season.
*   **House:** Faction/banner.
*   **World Pulse:** In-game event.
*   **Decree:** Daily modifier.
*   **Forge:** Custom map editor.
*   **Ghost:** Replay of another player to race against.
*   **Fairness Firewall:** Keeping the competitive scene strictly skill-capped.

---

## 20. Competition and Positioning
*   **OpenFront.io:** Leader (~225k daily players), real-time, fixed real-world maps, monetizes via ads + cosmetics.
*   **Territorial.io:** The minimalist original.
*   **Everfront (Steam 2026):** "Territory + real-time roguelike" — this angle is being occupied.
*   **Seedreign's Wedge (The Void):** Asynchronous + daily seed + living map + meta-progression, mobile-first. Do not compete head-on; attack where the leaders are weak.

---

## 21. Language and Internationalization (i18n)
*   **MAIN LANGUAGE:** ENGLISH (default). The app is English-first.
*   **Secondary Language:** Portuguese (pt). Architecture is ready to add more languages in the future (es, fr, de, ...) simply with a new translation file.
*   **Library:** next-intl (App Router). ALL UI text comes from translation keys — ZERO hardcoded strings.
*   **Message Files:** `messages/en.json` (source of truth) and `messages/pt.json`, one per language. Adding a language = creating `messages/xx.json` (e.g., `es.json`) and registering it in the config.
*   **Locale Routing:** English on the root without a prefix (`seedreign.io` = English), Portuguese at `seedreign.io/pt` (localePrefix 'as-needed').
*   **Copywriting:** Written FIRST in English (default) and translated to pt. In future prompts, when example copy appears in Portuguese, treat it as the pt translation — the default key value is English.
*   **UX:** Detect browser language and allow user switching (EN/PT selector in navbar and footer), saving the preference.
*   **SEO:** Format dates/numbers per locale; add metadata/OG and hreflang per language.

---

## 22. Working Rules for Claude Code
*   Follow this bible in all decisions. If something isn't here, ask before assuming.
*   Performance first; all animations respect `prefers-reduced-motion`; mobile-first; accessible (WCAG AA).
*   Single domain (no subdomains). Strict TypeScript, reusable components.
*   Small and descriptive commits. At the end of each step, state what was done and how to verify it.

---

## 23. Toolchain
*   **Package manager: bun, always.** `bun install`, `bun add`, `bun run <script>`, `bunx`. Never npm, pnpm or yarn, and never commit a `package-lock.json`.
*   **Lint and format: Biome, only.** Config lives in `biome.json`. ESLint and Prettier are not used and must not be reintroduced.
*   `bun run check` is the one command that formats, sorts Tailwind classes, organizes imports and lints. `bun run typecheck` runs route typegen plus `tsc --noEmit`.

---

## 24. Writing Rules (code, comments, copy, docs)
*   **Never use an em dash.** Not in code, comments, UI copy, commit messages or docs. Use a comma, a colon, parentheses, or split the sentence.
*   **Comments explain WHY, never what.** They must never reference this file, a section number, an AI, an assistant, or any tooling that generated the code. A comment is written as if a human on the team wrote it.
*   **Configuration is explicit.** No `process.env.X ?? "fallback"` patterns and no silent defaults. Site-wide values are literals in `src/lib/site.ts`; if a value must change, it is changed there on purpose.
*   Copy is written in English first (`messages/en.json` is the source of truth), then translated to Portuguese.
*   **Never state the project's development stage in anything user facing.** No "in development", "early access", "coming soon", "alpha", "beta", "prototype", "phase N", "not released yet", or any equivalent, in UI copy, metadata, `llms.txt`, images or alt text. The site always reads as a finished product. Internal planning stays in this file and in commit messages.

---

## 25. Visual Style (applies to EVERY page)
*   **This must look and feel like a modern game, never like a SaaS product or a corporate site.** Relaxed, playful, gamified, confident.
*   That applies to every surface without exception, including error pages, empty states, loading states and the 404.
*   Concrete expectations: bold display type for titles, HUD-style panels with live data (seeds, timers, counters), status pills with pulsing dots, glowing gold calls to action, deep dark surfaces with the brand grid and glows, generous spacing, no stock corporate imagery and no generic marketing tone.
*   Copy is direct and player-facing. Speak to a player, not to a buyer.
*   None of this overrides accessibility or performance: every effect stays behind `prefers-reduced-motion`, contrast still clears WCAG AA, and mobile is designed first.