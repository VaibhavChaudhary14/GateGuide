# GATE Data Science & AI (DA) PYQ Platform

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
*   **High-Scale Multi-Tier Cache Memory (100+ Users):** Integrated LRU Memory Cache Engine (`cache_manager.js`) and distributed Redis L4 API Layer (`server_cache_redis.js`) benchmarked for sub-10ms response times across 100+ simultaneous candidates. See [system_design_and_cache.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/system_design_and_cache.md) for full system design.
*   **Analysis Dashboard:** Provides insight into high-priority recurrence topics, identical concepts repeated across exam cycles, and year-by-year subject weight distributions.

---

## 🛠️ Technology Stack

*   **Structure:** HTML5
*   **Styling:** Vanilla CSS3 (Custom Variables, CSS Grid, Flexbox, Glassmorphic overlays)
*   **Logic:** Javascript (ES6+, client-side event loops, DOM-driven renderer)
*   **Fonts:** *Plus Jakarta Sans* and *Fira Code* (for math/code blocks) from Google Fonts
*   **PDF Libraries:** Local offline copies of `jsPDF` and `jsPDF-AutoTable`

---

## 📋 Production Audit & Architecture Reports

- [AUDIT.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/AUDIT.md) — Complete codebase inventory, dependency trace, and data risk assessment.
- [ARCHITECTURE.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/ARCHITECTURE.md) — Multi-tier architecture, `countries.dev` design system tokens, and data flow.
- [MIGRATION_MAP.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/MIGRATION_MAP.md) — Route hierarchy and file consolidation mapping.
- [FEATURE_PARITY.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/FEATURE_PARITY.md) — Checklist of feature parity, PYQ metrics, and verification status.
- [TEST_REPORT.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/TEST_REPORT.md) — Verification report for Python database validator & Node.js 100-user Redis benchmark.
- [system_design_and_cache.md](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/system_design_and_cache.md) — System design & Redis cache memory capacity calculations.

---

## 🚀 Quick Start

1. Clone or download the project folder.
2. Double-click [index.html](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/index.html) to launch the SaaS Landing Page.
3. Click **"Explore PYQs"** to open the [pyqs.html](file:///c:/Users/Vaibhav%20Chaudhary/OneDrive/Desktop/GATE%202027/GateGuide/pyqs.html) workspace.
4. *Note:* No internet connection, server configurations, or installation commands (`npm install`) are required to run the portal.

---

## 📂 Project Directory Structure

```
GateGuide/
├── index.html                     # Main SaaS Landing Page & Product Overview
├── pyqs.html                      # Unified GATE DA PYQ Study & Practice Workspace
├── gate-cse-command-center.html   # Adaptive GATE CSE Personal Study Command Center
├── styles.css                     # countries.dev unified design system & tokens
├── app.js                         # Application state engine, interactive logic, and PDF generator
├── user_saas_store.js             # SaaS zero-signup candidate profile & activity log engine
├── cache_manager.js               # Client-side LRU cache memory & telemetry manager
├── server_cache_redis.js          # Distributed Redis API server & 100-user benchmark suite
├── database.js                    # Unified JSON questions database & Base64 asset store
├── jspdf.umd.min.js               # Local library code for PDF creation
├── jspdf.plugin.autotable.min.js  # Local library plugin for generating PDF grids
├── scripts/
│   └── validate_database.py       # Automated database schema validation script
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

## 🔧 Database Integrity Validation

The database contents are verified using the Python validation script. To run the validation locally:

```bash
python scripts/validate_database.py
```

The script checks for:
*   Presence of all required question attributes (`id`, `subject`, `unit`, `topic`).
*   Verification of question numbers (must be between 11 and 65).
*   Correct option object structures for MCQs/MSQs.
*   The existence of fallback local PNG image files.
*   Successful matching and parsing of official answer strings.
*   Completeness of subject categorization.
