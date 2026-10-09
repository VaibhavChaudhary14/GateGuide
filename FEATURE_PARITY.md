# GATEGuide Feature Parity & Verification Matrix (`FEATURE_PARITY.md`)

---

## 1. Feature Parity Checklist

| Feature Module | Original Implementation | Consolidation Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Syllabus-Aligned Navigation** | Accordion tree by Subject/Unit/Topic | Preserved & Enhanced | 7 Core Subjects, 165 Questions mapped in `pyqs.html` & `app.js`. |
| **Visual Fidelity Rendering** | Inlined Base64 cropped PNG images | Preserved Intact | 165/165 Base64 image byte streams (`\x89PNG`) decoded & verified by `scripts/validate_database.py`. |
| **CORS-Proof Offline Operation** | `file:///` protocol support | Preserved Intact | Zero external image URL dependencies; runs 100% locally. |
| **Interactive Practice Mode** | Radio (MCQ), Checkbox (MSQ), Range (NAT) | Preserved & Enhanced | `validateAnswer()` handles string keys, `TO` ranges, and `MTA` keys. Logged to SaaS store. |
| **Mock Test Exam Simulator** | Customizable paper length, timer, GATE grading | Preserved Intact | Enforces $+Marks$ and $-Marks/3$ MCQ penalties; time tracked in `test-workspace`. |
| **Offline PDF Compiler** | Subject-wise book & card export via `jsPDF` | Preserved Intact | `downloadSubjectPDF()` and `downloadQuestionPDF()` verified using offline `jsPDF` scripts. |
| **Analytics Dashboard** | Recurrence topics, repeated questions, weight bar | Preserved & Cached | Computed dynamically and cached via `gateCacheManager`. |
| **Adaptive CSE Study Planner** | Multi-tab decision engine, pair matrix, mastery sliders | Preserved Intact | Retained in `gate-cse-command-center.html` with updated design system. |
| **Node Backend & Rate Limiter** | Client LRU + Node Server Prototype | Implemented Prototype | Verified via `node scripts/benchmark_http.js` at 981 QPS over 100 HTTP client TCP sockets. |
| **Zero-Signup SaaS Identity** | Candidate ID, streak, timestamped logs, JSON backup | Implemented | Implemented in `user_saas_store.js` with profile modal & backup export/import. |
| **Interactive Technical Docs** | Raw `.md` files | Implemented | Built `docs.html` with live API playground & JSON schema explorer. |
| **Functional Search Bar** | Static input | Enhanced | Hero search form on `index.html` redirects to `pyqs.html?search=QUERY`, which auto-filters questions on load. |
| **Automated CI Integration** | None | Implemented | `.github/workflows/ci.yml` runs database validation, syntax checks, and HTTP benchmark on push & PR. |

---

## 2. Quantitative Data Parity & Verification Baseline

- **Total Questions in Database (`database.js`)**: 165 Questions (Q11-Q65 across 2024, 2025, 2026).
- **Multiple Choice Questions (MCQ)**: 75 Questions
- **Multiple Select Questions (MSQ)**: 44 Questions
- **Numerical Answer Type (NAT)**: 46 Questions
- **Total Inlined Cropped PNG Images**: 165 Base64 URIs (100% decoded with binary PNG headers)
- **Database SHA-256 Hash**: `661f038877041c014fc91597f8e348aa62de9a17d1fecb7768562a8611aa1f9b`
- **Data Parity Verification**: 100% equivalent before and after consolidation.
