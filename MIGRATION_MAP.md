# GATEGuide Migration Mapping (`MIGRATION_MAP.md`)

---

## 1. File Consolidation & Destination Mapping

| Original Source File | Final Destination / Route | Transformation & Integration Summary |
| :--- | :--- | :--- |
| `landing.html` (Original Landing) | `index.html` | Converted into primary SaaS landing page with `countries.dev` aesthetics, active search form, feature matrix, and live candidate profile card. Original `landing.html` set to redirect to `index.html`. |
| `index.html` (Original PYQ Shell) | `pyqs.html` | Moved to `pyqs.html` as dedicated GATE DA PYQ Study & Practice Workspace. Header updated with `gateguide.dev` nav bar and home link. |
| `technical_documentation.md` (Raw Docs) | `docs.html` | Replaced raw markdown file links with interactive `docs.html` documentation web page featuring live API playground and JSON schema inspector. |
| `gate-cse-command-center.html` | `gate-cse-command-center.html` | Retained as dedicated CSE study planner workspace; header updated with `countries.dev` styled navigation links and candidate badge. |
| `styles.css` | `styles.css` | Consolidated global styling sheet; added `countries.dev` design system tokens, pill buttons (`btn-pill`), 1px grid borders, KBD shortcut tags, and SaaS profile modal styles. |
| `app.js` | `app.js` | Updated `initApp()` to parse URL search parameters (`?search=query`), integrated `gateCacheManager` for filtered queries, and logged activity events to `gateSaaSStore`. |
| `database.js` | `database.js` | Preserved 100% intact (165 questions + Base64 crops). |
| `cache_manager.js` | `cache_manager.js` | Created client LRU Cache engine ($O(1)$ lookup, capacity 120 queries, latency telemetry). |
| `user_saas_store.js` | `user_saas_store.js` | Created zero-signup SaaS profile store, candidate ID generator, daily streak calculator, activity logger, and backup export/import engine. |
| `server_cache_redis.js` | `server_cache_redis.js` | Updated to zero-dependency Node.js HTTP server + Redis L4 cache layer & 100-user benchmark suite. |
| `scripts/validate_database.py` | `scripts/validate_database.py` | Fixed hardcoded file paths to use relative directory resolution. |

---

## 2. Route Hierarchy Mapping

```
gateguide.dev/
├── index.html                    [Home / SaaS Product Overview]
├── pyqs.html                     [GATE DA PYQ Study & Practice Workspace]
├── gate-cse-command-center.html  [Adaptive GATE CSE Personal Study Planner]
├── docs.html                     [Interactive Technical Docs & API Playground]
├── landing.html                  [Redirect Helper -> index.html]
├── system_design_and_cache.md    [Architecture & Cache Specification]
└── technical_documentation.md    [Legacy Documentation Archive]
```
