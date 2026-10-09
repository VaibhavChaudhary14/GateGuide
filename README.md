# GATE Data Science & Artificial Intelligence (DA) PYQ Platform

A premium, offline-first educational platform designed to search, filter, practice, and analyze Previous Year Questions (PYQs) from the official **GATE Data Science & Artificial Intelligence (DA)** exams (2024, 2025, and 2026).

---

## 🌟 Key Features

*   **Syllabus-Aligned Navigation:** Questions are systematically cataloged according to the official GATE DA syllabus (Subjects, Units, and Topics) for targeted study.
*   **High-Fidelity Rendering:** Uses high-resolution cropped PNG images directly from the official papers. This ensures mathematical equations, code listings, and charts are rendered with 100% fidelity compared to plain HTML text.
*   **100% Offline-First (CORS-Proof):** All cropped question images are inlined as Base64 data strings in the database layer. The platform works directly from your local filesystem (`file:///` protocol) without needing a web server or throwing browser sandbox security errors.
*   **Interactive Practice Mode:** Enable **Practice Mode** to submit answers on-the-fly. Includes support for:
    *   **MCQs:** Standard radio-button inputs.
    *   **MSQs:** Multi-select checkboxes (validates correct selection subsets).
    *   **NATs:** Smart numerical validation supporting ranges (e.g., `0.12 TO 0.13`) and decimal precision tolerance.
*   **Practice Test (Mock Exam) Simulator:** Set up customizable mock tests.
    *   Filter by Year, Subject, and Question Type.
    *   Set custom paper lengths (5, 10, 15, 20, 30, or a full 55-question paper).
    *   Features active timer tracking and official GATE marking rules ($+Marks$, and $-Marks/3$ for incorrect MCQs).
*   **Offline PDF Generator:** Compile clean, subject-wise revision question books or single-question cards directly in your browser using client-side `jsPDF` integrations.
*   **Multi-Tier Cache Memory & Optional API Engine:** Integrated LRU Memory Cache Engine (`cache_manager.js`) and Node.js backend server (`server_cache_redis.js`) featuring a true sliding-window rate limiter, optional `ioredis` TCP socket support, and a real 100-client HTTP socket benchmark (`scripts/benchmark_http.js`) delivering 981 QPS. See [system_design_and_cache.md](system_design_and_cache.md) for full system design.
*   **Analysis Dashboard:** Provides insight into high-priority recurrence topics, identical concepts repeated across exam cycles, and year-by-year subject weight distributions.

---

## 🛠️ Technology Stack

*   **Structure:** HTML5
*   **Styling:** Vanilla CSS3 (Custom Variables, CSS Grid, Flexbox, Glassmorphic overlays)
*   **Logic:** Javascript (ES6+, client-side event loops, DOM-driven renderer)
*   **Fonts:** *Plus Jakarta Sans* and *Fira Code* (for math/code blocks) from Google Fonts
*   **PDF Libraries:** Local offline copies of `jsPDF` and `jsPDF-AutoTable`
*   **Backend & Cache (Optional):** Pure Node.js HTTP server, `ioredis` fallback engine, sliding-window rate limiter

---

## 📋 Production Audit & Architecture Reports

- [AUDIT.md](AUDIT.md) — Complete codebase inventory, dependency trace, and data risk assessment.
- [ARCHITECTURE.md](ARCHITECTURE.md) — Multi-tier architecture, `countries.dev` design system tokens, and data flow.
- [MIGRATION_MAP.md](MIGRATION_MAP.md) — Route hierarchy and file consolidation mapping.
- [FEATURE_PARITY.md](FEATURE_PARITY.md) — Checklist of feature parity, PYQ metrics, and verification status.
- [TEST_REPORT.md](TEST_REPORT.md) — Verification report for Python database validator & Node.js 100-user HTTP benchmark.
- [system_design_and_cache.md](system_design_and_cache.md) — System design & Redis cache memory capacity calculations.

---

## 🚀 Quick Start

1. Clone or download the project folder.
2. Double-click [index.html](index.html) to launch the SaaS Landing Page.
3. Click **"Explore PYQs"** to open the [pyqs.html](pyqs.html) workspace.
4. *Note:* No internet connection, server configurations, or installation commands (`npm install`) are required to run the client portal.

---

## 📂 Project Directory Structure

```
GateGuide/
├── index.html                     # Main SaaS Landing Page & Product Overview
├── pyqs.html                      # Unified GATE DA PYQ Study & Practice Workspace
├── gate-cse-command-center.html   # Adaptive GATE CSE Personal Study Command Center
├── docs.html                      # Interactive Technical Documentation & Live API Playground
├── styles.css                     # countries.dev unified design system & tokens
├── app.js                         # Application state engine, interactive logic, and PDF generator
├── user_saas_store.js             # SaaS zero-signup candidate profile & activity log engine
├── cache_manager.js               # Client-side LRU cache memory & telemetry manager
├── server_cache_redis.js          # Node.js API Server, sliding-window rate limiter & ioredis manager
├── database.js                    # Unified JSON questions database & Base64 asset store
├── jspdf.umd.min.js               # Local library code for PDF creation
├── jspdf.plugin.autotable.min.js  # Local library plugin for generating PDF grids
├── validation_report.md           # Automated database validation audit report
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions CI workflow (Validation, Syntax, HTTP Benchmark)
├── scripts/
│   ├── validate_database.py       # Automated database schema & Base64 PNG validator
│   └── benchmark_http.js          # Real 100-client HTTP socket load benchmark harness
└── images/
    └── q_202X_XX.png              # Fallback local PNG crops of exam questions
```

---

## 📊 Database Summary

The platform indexes a total of **165 core questions** (Q11 to Q65) from the official papers. General Aptitude (Q1 to Q10) has been excluded.

### Question Formats
*   **Multiple Choice (MCQ):** 75 questions
*   **Multiple Select (MSQ):** 44 questions
*   **Numerical Answer (NAT):** 46 questions

### Syllabus Matrix
*   **Probability & Statistics:** 36 questions
*   **Programming, Data Structures & Algorithms:** 33 questions
*   **Machine Learning:** 28 questions
*   **Database Management & Warehousing:** 21 questions
*   **Linear Algebra:** 18 questions
*   **Artificial Intelligence:** 17 questions
*   **Calculus & Optimization:** 12 questions

---

## 🔧 Database Integrity & CI Validation

The database contents and API server are verified using automated Python and Node.js validation scripts:

```bash
# 1. Run Python Database Schema & Base64 PNG Validator
python scripts/validate_database.py

# 2. Run Real 100-Client HTTP Socket Concurrency Benchmark
node scripts/benchmark_http.js
```

The validation suite checks:
*   Presence of all required question attributes (`id`, `subject`, `unit`, `topic`).
*   Binary decoding of all 165 Base64 PNG image strings (`imageData`) verifying `\x89PNG` headers.
*   Correct option object structures and answer key validation for MCQs/MSQs.
*   Numeric, range (`X TO Y`), or official key formats for NATs.
*   SHA-256 database hash generation (`validation_report.md`).
