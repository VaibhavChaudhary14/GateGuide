// App State
let activeSubject = "All Subjects";
let activeUnit = "All Units";
let activeTopic = "All Topics";
let activeYear = "all";
let searchQuery = "";
let practiceMode = false;
let showAIExplanations = false;

// Practice answers storage (qId -> selectedOption or userText)
let userAnswers = {};
let submittedAnswers = {}; // qId -> boolean (whether submitted)

// -------------------------------------------------------------
// PRACTICE TEST MODE STATE
// -------------------------------------------------------------
let testModeActive = false;
let testQuestions = [];
let testAnswers = {};
let currentTestIndex = 0;
let testTimerInterval = null;
let testElapsedTime = 0;
let testReviewMode = false;
let testReviewData = [];

// On Load
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    renderSidebar();
    renderToolbar();
    renderContent();
    renderDashboard();
    renderSimulator();
    if (window.gateSaaSStore) {
        window.gateSaaSStore.notifyUI();
    }
}

// -------------------------------------------------------------
// DYNAMIC CALCULATIONS FOR DASHBOARD
// -------------------------------------------------------------

// Calculate topic frequencies
function getHighPriorityTopics() {
    const topicCounts = {};
    
    QUESTIONS_DATABASE.forEach(q => {
        const key = `${q.subject} ||| ${q.unit} ||| ${q.topic}`;
        if (!topicCounts[key]) {
            topicCounts[key] = {
                subject: q.subject,
                unit: q.unit,
                topic: q.topic,
                count2024: 0,
                count2025: 0,
                count2026: 0,
                years: new Set()
            };
        }
        
        topicCounts[key].years.add(q.year);
        if (q.year === 2024) topicCounts[key].count2024++;
        else if (q.year === 2025) topicCounts[key].count2025++;
        else if (q.year === 2026) topicCounts[key].count2026++;
    });
    
    return Object.values(topicCounts)
        .map(t => ({
            ...t,
            total: t.count2024 + t.count2025 + t.count2026,
            yearsCount: t.years.size,
            yearsStr: Array.from(t.years).sort().join(", ")
        }))
        .sort((a, b) => b.total - a.total || b.yearsCount - a.yearsCount);
}

// Group repeated questions
function getRepeatedQuestions() {
    return [
        {
            title: "Bayes' Theorem probability calculation",
            topic: "Bayes theorem",
            yearQuestions: { 2024: "Q58", 2026: "Q58" },
            frequency: 2
        },
        {
            title: "Exponential distribution expectation and variance relation",
            topic: "Exponential distribution",
            yearQuestions: { 2024: "Q57", 2026: "Q57" },
            frequency: 2
        },
        {
            title: "Uniform distribution continuous probability",
            topic: "Uniform distribution",
            yearQuestions: { 2024: "Q56", 2026: "Q56" },
            frequency: 2
        },
        {
            title: "SVD of a rank-one matrix",
            topic: "Rank-one SVD",
            yearQuestions: { 2024: "Q61", 2026: "Q61" },
            frequency: 2
        },
        {
            title: "Properties and relations in rooted binary trees",
            topic: "Binary-tree properties",
            yearQuestions: { 2024: "Q52", 2026: "Q52" },
            frequency: 2
        }
    ];
}

// Year-wise Analysis
function getYearWiseStats() {
    const stats = {
        2024: { total: 0, subjects: {} },
        2025: { total: 0, subjects: {} },
        2026: { total: 0, subjects: {} }
    };
    
    QUESTIONS_DATABASE.forEach(q => {
        if (stats[q.year]) {
            stats[q.year].total++;
            stats[q.year].subjects[q.subject] = (stats[q.year].subjects[q.subject] || 0) + 1;
        }
    });
    
    return stats;
}

// -------------------------------------------------------------
// UI RENDERING FUNCTIONS
// -------------------------------------------------------------

function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;
    
    const tree = {};
    const subjectCounts = {};
    
    QUESTIONS_DATABASE.forEach(q => {
        subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
        
        if (!tree[q.subject]) tree[q.subject] = {};
        if (!tree[q.subject][q.unit]) tree[q.subject][q.unit] = new Set();
        tree[q.subject][q.unit].add(q.topic);
    });
    
    let html = `
        <div class="sidebar-header">
            <h3>Syllabus Navigation</h3>
        </div>
        <div class="sidebar-menu">
            <div class="menu-item ${activeSubject === "All Subjects" && !testModeActive ? "active" : ""}" onclick="selectSyllabus('All Subjects')">
                <span class="menu-text">All Subjects</span>
                <span class="badge">${QUESTIONS_DATABASE.length}</span>
            </div>
    `;
    
    Object.keys(tree).sort().forEach(subj => {
        const count = subjectCounts[subj] || 0;
        const isSubjActive = activeSubject === subj && !testModeActive;
        
        html += `
            <div class="subject-group ${isSubjActive ? "open" : ""}">
                <div class="menu-item subject-header ${isSubjActive ? "active" : ""}" onclick="selectSyllabus('${subj}')">
                    <span class="menu-text">${subj}</span>
                    <span class="badge">${count}</span>
                </div>
                <div class="units-container">
        `;
        
        Object.keys(tree[subj]).sort().forEach(unit => {
            const isUnitActive = isSubjActive && activeUnit === unit;
            html += `
                <div class="unit-group">
                    <div class="unit-header ${isUnitActive ? "active" : ""}" onclick="selectSyllabus('${subj}', '${unit}')">
                        ${unit}
                    </div>
                    <div class="topics-container">
            `;
            
            Array.from(tree[subj][unit]).sort().forEach(topic => {
                const isTopicActive = isSubjActive && isUnitActive && activeTopic === topic;
                const topicCount = QUESTIONS_DATABASE.filter(q => q.subject === subj && q.unit === unit && q.topic === topic).length;
                html += `
                    <div class="topic-item ${isTopicActive ? "active" : ""}" onclick="selectSyllabus('${subj}', '${unit}', '${topic}')">
                        ${topic} <span class="topic-badge">${topicCount}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    sidebar.innerHTML = html;
}

function renderToolbar() {
    const toolbar = document.getElementById("toolbar");
    if (!toolbar) return;
    
    toolbar.innerHTML = `
        <div class="countries-search-bar" style="max-width: 480px;">
            <span style="color: var(--text-muted); font-size: 14px;">🔍</span>
            <input type="text" id="search-input" placeholder="Search questions, topics, subjects..." value="${searchQuery}" oninput="handleSearch(this.value)">
            <kbd>⌘K</kbd>
        </div>
        <div class="filters">
            <select id="year-filter" onchange="handleYearFilter(this.value)">
                <option value="all" ${activeYear === "all" ? "selected" : ""}>All Years</option>
                <option value="2024" ${activeYear === "2024" ? "selected" : ""}>2024</option>
                <option value="2025" ${activeYear === "2025" ? "selected" : ""}>2025</option>
                <option value="2026" ${activeYear === "2026" ? "selected" : ""}>2026</option>
            </select>
            <div class="toggle-buttons">
                <button class="btn toggle-btn ${practiceMode ? "active" : ""}" onclick="togglePracticeMode()">
                    Practice Mode: ${practiceMode ? "ON" : "OFF"}
                </button>
                <button class="btn toggle-btn ${showAIExplanations ? "active" : ""}" onclick="toggleAIExplanations()">
                    AI Explanations: ${showAIExplanations ? "ON" : "OFF"}
                </button>
            </div>
        </div>
    `;
}

function renderContent() {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    
    let filtered = window.gateCacheManager ? 
        window.gateCacheManager.getFilteredQuestions(QUESTIONS_DATABASE, activeSubject, activeUnit, activeTopic, activeYear, searchQuery) :
        QUESTIONS_DATABASE.filter(q => {
            if (activeSubject !== "All Subjects" && q.subject !== activeSubject) return false;
            if (activeUnit !== "All Units" && q.unit !== activeUnit) return false;
            if (activeTopic !== "All Topics" && q.topic !== activeTopic) return false;
            if (activeYear !== "all" && q.year.toString() !== activeYear) return false;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const textMatch = q.questionText.toLowerCase().includes(query);
                const numMatch = `q${q.questionNumber}`.includes(query) || `q.${q.questionNumber}`.includes(query) || q.questionNumber.toString() === query;
                const topicMatch = q.topic.toLowerCase().includes(query);
                const subjectMatch = q.subject.toLowerCase().includes(query);
                const unitMatch = q.unit.toLowerCase().includes(query);
                return textMatch || numMatch || topicMatch || subjectMatch || unitMatch;
            }
            return true;
        });
    
    let breadcrumbHtml = `
        <div class="breadcrumbs">
            <span onclick="selectSyllabus('All Subjects')">GATE DA PYQs</span>
            ${activeSubject !== "All Subjects" ? ` <span>/</span> <span onclick="selectSyllabus('${activeSubject}')">${activeSubject}</span>` : ""}
            ${activeUnit !== "All Units" ? ` <span>/</span> <span onclick="selectSyllabus('${activeSubject}', '${activeUnit}')">${activeUnit}</span>` : ""}
            ${activeTopic !== "All Topics" ? ` <span>/</span> <span>${activeTopic}</span>` : ""}
        </div>
    `;
    
    let actionsHeader = `
        <div class="actions-header">
            <h2>${activeTopic !== "All Topics" ? activeTopic : activeUnit !== "All Units" ? activeUnit : activeSubject}</h2>
            <div class="export-actions">
                ${activeSubject !== "All Subjects" ? `
                    <button class="btn btn-primary" onclick="downloadSubjectPDF('${activeSubject}')">
                        Download Subject PDF
                    </button>
                ` : ""}
            </div>
        </div>
        <p class="results-count">Found ${filtered.length} questions matching criteria</p>
    `;
    
    if (filtered.length === 0) {
        mainContent.innerHTML = breadcrumbHtml + actionsHeader + `
            <div class="empty-state-card">
                <h3>No Questions Found</h3>
                <p>Try broadening your filters or search query.</p>
            </div>
        `;
        return;
    }
    
    let questionsHtml = '<div class="questions-list">';
    
    filtered.forEach(q => {
        const isSubmitted = submittedAnswers[q.id];
        const userAnswer = userAnswers[q.id];
        const isCorrect = validateAnswer(q, userAnswer);
        
        // Natively open page in original paper (relative paths)
        const paperUrl = `../DA%20${q.year}.pdf#page=${q.sourcePage}`;
        
        questionsHtml += `
            <div class="question-card" id="card-${q.id}">
                <div class="card-header">
                    <span class="meta-tag year-tag">GATE DA ${q.year}</span>
                    <span class="meta-tag qnum-tag">Q. ${q.questionNumber}</span>
                    <span class="meta-tag type-tag">${q.questionType}</span>
                    <span class="meta-tag marks-tag">${q.marks} Mark${q.marks > 1 ? "s" : ""}</span>
                    <span class="meta-tag topic-tag-meta">${q.topic}</span>
                </div>
                
                <div class="card-body">
                    <!-- High-fidelity cropped image from Base64 -->
                    <div class="question-image-container">
                        <img src="${q.imageData || q.imagePath}" class="question-image" alt="Question Crop" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="question-text-fallback" style="display:none;">
                            <pre class="fallback-pre">${q.questionText}</pre>
                        </div>
                    </div>
                    
                    <!-- Practice interactive input -->
                    ${practiceMode ? renderPracticeInput(q) : ""}
                    
                    <!-- Submission status message -->
                    ${isSubmitted ? `
                        <div class="submission-feedback ${isCorrect ? "feedback-correct" : "feedback-incorrect"}">
                            <strong>${isCorrect ? "✓ Correct!" : "✗ Incorrect"}</strong>
                            <span>Your Answer: ${userAnswer || "None"} | Correct Answer: ${q.officialAnswer}</span>
                        </div>
                    ` : ""}
                </div>
                
                <div class="card-footer">
                    <a href="${paperUrl}" target="_blank" class="btn btn-secondary">
                        View in Original Paper
                    </a>
                    <button class="btn btn-secondary" onclick="downloadQuestionPDF('${q.id}')">
                        Download Question PDF
                    </button>
                    <button class="btn btn-primary" id="sol-btn-${q.id}" onclick="toggleSolution('${q.id}')">
                        Show Solution
                    </button>
                </div>
                
                <!-- Hidden Solution Area -->
                <div class="solution-drawer" id="sol-drawer-${q.id}" style="display: none;">
                    <div class="solution-header">
                        <h4>Answer Key & Official Solution</h4>
                    </div>
                    <div class="solution-body">
                        <div class="sol-section">
                            <strong>Official Answer:</strong>
                            <span class="official-answer-key">${q.officialAnswer}</span>
                        </div>
                        
                        <div class="sol-section">
                            <strong>Official Solution:</strong>
                            <p class="official-solution-text">${q.officialSolution || "Detailed official solution was not provided in the supplied source."}</p>
                        </div>
                        
                        <!-- AI Explanation, shown if toggle is enabled -->
                        ${showAIExplanations ? `
                            <div class="sol-section ai-explanation-section">
                                <strong>AI Step-by-Step Explanation:</strong>
                                <div class="ai-explanation-content">${q.aiExplanation.replace(/\n/g, '<br>')}</div>
                            </div>
                        ` : ""}
                    </div>
                </div>
            </div>
        `;
    });
    
    questionsHtml += '</div>';
    mainContent.innerHTML = breadcrumbHtml + actionsHeader + questionsHtml;
}

function renderPracticeInput(q, isTest = false) {
    const isSubmitted = isTest ? false : submittedAnswers[q.id];
    const currentAnswer = isTest ? (testAnswers[q.id] || "") : (userAnswers[q.id] || "");
    
    let html = '<div class="practice-input-area">';
    const onChangeFn = isTest ? `saveTestAnswer` : `saveAnswer`;
    const onMsqChangeFn = isTest ? `saveTestMsqAnswer` : `saveMsqAnswer`;
    
    if (q.questionType === "MCQ") {
        html += '<div class="options-container">';
        ["A", "B", "C", "D"].forEach(opt => {
            const isSelected = currentAnswer === opt;
            html += `
                <label class="option-label ${isSelected ? "selected" : ""} ${isSubmitted ? "disabled" : ""}">
                    <input type="radio" name="practice-${q.id}" value="${opt}" 
                        ${isSelected ? "checked" : ""} 
                        ${isSubmitted ? "disabled" : ""} 
                        onchange="${onChangeFn}('${q.id}', '${opt}')">
                    <span class="option-box">${opt}</span>
                </label>
            `;
        });
        html += '</div>';
    } else if (q.questionType === "MSQ") {
        html += '<div class="options-container">';
        ["A", "B", "C", "D"].forEach(opt => {
            const isSelected = currentAnswer.split(";").includes(opt);
            html += `
                <label class="option-label ${isSelected ? "selected" : ""} ${isSubmitted ? "disabled" : ""}">
                    <input type="checkbox" name="practice-${q.id}" value="${opt}" 
                        ${isSelected ? "checked" : ""} 
                        ${isSubmitted ? "disabled" : ""} 
                        onchange="${onMsqChangeFn}('${q.id}', '${opt}')">
                    <span class="option-box">${opt}</span>
                </label>
            `;
        });
        html += '</div>';
        html += '<small class="hint-text">(Select all options that apply, separated by semicolons)</small>';
    } else if (q.questionType === "NAT") {
        html += `
            <div class="nat-input-container">
                <input type="text" class="nat-input" placeholder="Enter numerical value or range" 
                    value="${currentAnswer}" 
                    ${isSubmitted ? "disabled" : ""} 
                    oninput="${onChangeFn}('${q.id}', this.value)">
            </div>
        `;
    }
    
    if (!isTest) {
        if (!isSubmitted) {
            html += `
                <button class="btn btn-primary btn-submit-answer" onclick="submitAnswer('${q.id}')" ${!currentAnswer ? "disabled" : ""}>
                    Submit Answer
                </button>
            `;
        } else {
            html += `
                <button class="btn btn-secondary btn-submit-answer" onclick="resetAnswer('${q.id}')">
                    Try Again
                </button>
            `;
        }
    }
    
    html += '</div>';
    return html;
}

function renderDashboard() {
    const dashboard = document.getElementById("dashboard-stats");
    if (!dashboard) return;
    
    const prio = getHighPriorityTopics();
    const repeats = getRepeatedQuestions();
    const stats = getYearWiseStats();
    
    let html = `
        <div class="dashboard-grid">
            <div class="dashboard-card priority-card-dash">
                <div class="card-head-dash">
                    <h3>High Priority Topics</h3>
                    <span class="dash-hint">Based on question counts & recurrence</span>
                </div>
                <div class="dash-list">
    `;
    
    prio.slice(0, 6).forEach((p, idx) => {
        html += `
            <div class="dash-item" onclick="selectSyllabus('${p.subject}', '${p.unit}', '${p.topic}')" style="cursor:pointer;">
                <div class="prio-rank">#${idx + 1}</div>
                <div class="prio-info">
                    <strong>${p.topic}</strong>
                    <span>${p.subject} · ${p.yearsCount} year${p.yearsCount > 1 ? "s" : ""}</span>
                </div>
                <div class="prio-count">${p.total} Qs</div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="dashboard-card repeats-card-dash">
                <div class="card-head-dash">
                    <h3>Identical / Repeated Questions</h3>
                    <span class="dash-hint">Cross-year exact duplicates</span>
                </div>
                <div class="dash-list">
    `;
    
    repeats.forEach(r => {
        html += `
            <div class="dash-item-repeat">
                <div class="repeat-info">
                    <strong>${r.title}</strong>
                    <span>Topic: ${r.topic}</span>
                </div>
                <div class="repeat-years">
                    <span class="rep-tag" onclick="selectAndReviewQuestion('${r.yearQuestions[2024]}', 2024)" style="cursor:pointer;">${r.yearQuestions[2024]} (2024)</span>
                    <span class="rep-tag" onclick="selectAndReviewQuestion('${r.yearQuestions[2026]}', 2026)" style="cursor:pointer;">${r.yearQuestions[2026]} (2026)</span>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="dashboard-card year-card-dash">
                <div class="card-head-dash">
                    <h3>Year-wise Distribution</h3>
                    <span class="dash-hint">Total questions and subject spread</span>
                </div>
                <div class="dash-list">
    `;
    
    Object.keys(stats).sort().forEach(year => {
        const data = stats[year];
        html += `
            <div class="dash-item-year">
                <div class="year-summary">
                    <strong>${year} Paper</strong>
                    <span>Total DA Questions: <strong>${data.total}</strong></span>
                </div>
                <div class="year-distribution-bar">
        `;
        
        const total = data.total;
        let index = 0;
        const colors = ["#5b5bd6", "#4a9a8f", "#d9a441", "#c259c2", "#e05353", "#59c2a0", "#b9822a"];
        
        Object.keys(data.subjects).forEach(subj => {
            const count = data.subjects[subj];
            const pct = (count / total) * 100;
            const color = colors[index % colors.length];
            html += `<div class="bar-slice" style="width: ${pct}%; background: ${color};" title="${subj}: ${count} (${pct.toFixed(0)}%)" onclick="selectSyllabus('${subj}')"></div>`;
            index++;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    dashboard.innerHTML = html;
}

// -------------------------------------------------------------
// EVENT HANDLERS
// -------------------------------------------------------------

function selectSyllabus(subject, unit = "All Units", topic = "All Topics") {
    // If test mode is active, prompt to exit
    if (testModeActive && !testReviewMode) {
        if (!confirm("Are you sure you want to exit the Practice Test? Your progress will be lost.")) {
            return;
        }
        exitTestMode();
    }
    
    activeSubject = subject;
    activeUnit = unit;
    activeTopic = topic;
    testModeActive = false;
    
    // Hide test workspace, show study workspace
    document.getElementById("study-workspace").style.display = "block";
    document.getElementById("test-workspace").style.display = "none";
    
    renderSidebar();
    renderContent();
}

function handleSearch(val) {
    searchQuery = val;
    renderContent();
}

function handleYearFilter(val) {
    activeYear = val;
    renderContent();
}

function togglePracticeMode() {
    practiceMode = !practiceMode;
    renderToolbar();
    renderContent();
}

function toggleAIExplanations() {
    showAIExplanations = !showAIExplanations;
    renderToolbar();
    renderContent();
}

function saveAnswer(qId, val) {
    userAnswers[qId] = val.trim();
    renderContent();
}

function saveMsqAnswer(qId, val) {
    let current = userAnswers[qId] ? userAnswers[qId].split(";") : [];
    if (current.includes(val)) {
        current = current.filter(x => x !== val);
    } else {
        current.push(val);
    }
    userAnswers[qId] = current.sort().join(";");
    renderContent();
}

function submitAnswer(qId) {
    submittedAnswers[qId] = true;
    const q = QUESTIONS_DATABASE.find(item => item.id === qId);
    if (q && window.gateSaaSStore) {
        const isCorrect = validateAnswer(q, userAnswers[qId]);
        window.gateSaaSStore.logActivity(
            "QUESTION_ATTEMPT",
            `Attempted Question ${q.questionNumber} (${q.year})`,
            `Subject: ${q.subject} | Result: ${isCorrect ? "✅ Correct" : "❌ Incorrect"}`,
            isCorrect ? "✅ Correct" : "❌ Incorrect",
            { qId, isCorrect }
        );
    }
    renderContent();
}

function resetAnswer(qId) {
    delete submittedAnswers[qId];
    delete userAnswers[qId];
    renderContent();
}

function validateAnswer(q, answer) {
    if (!answer) return false;
    
    const official = q.officialAnswer.toUpperCase().trim();
    const user = answer.toUpperCase().trim();
    
    if (q.questionType === "MCQ") {
        return official === user;
    } else if (q.questionType === "MSQ") {
        const officialOpts = official.split(";").sort().join(";");
        const userOpts = user.split(";").sort().join(";");
        return officialOpts === userOpts;
    } else if (q.questionType === "NAT") {
        // Range like "0.12 to 0.13" or "2 to 3"
        if (official.includes("TO")) {
            const parts = official.split("TO").map(p => parseFloat(p.trim()));
            const userNum = parseFloat(user);
            if (isNaN(userNum)) return false;
            return userNum >= parts[0] && userNum <= parts[1];
        } else {
            const userNum = parseFloat(user);
            const officialNum = parseFloat(official);
            if (isNaN(userNum) || isNaN(officialNum)) {
                return user === official;
            }
            return Math.abs(userNum - officialNum) < 1e-4;
        }
    }
    return false;
}

function toggleSolution(qId) {
    const drawer = document.getElementById(`sol-drawer-${qId}`);
    const btn = document.getElementById(`sol-btn-${qId}`);
    if (!drawer || !btn) return;
    
    if (drawer.style.display === "none") {
        drawer.style.display = "block";
        btn.textContent = "Hide Solution";
    } else {
        drawer.style.display = "none";
        btn.textContent = "Show Solution";
    }
}

// Navigate to a specific question from repeated group / review list
function selectAndReviewQuestion(qnumStr, year) {
    const qnum = parseInt(qnumStr.replace(/\D/g, ""));
    const targetQ = QUESTIONS_DATABASE.find(x => x.year === year && x.questionNumber === qnum);
    if (!targetQ) return;
    
    // Switch to normal study mode
    testModeActive = false;
    document.getElementById("study-workspace").style.display = "block";
    document.getElementById("test-workspace").style.display = "none";
    
    // Select the subject in the sidebar
    activeSubject = targetQ.subject;
    activeUnit = targetQ.unit;
    activeTopic = targetQ.topic;
    
    renderSidebar();
    renderContent();
    
    // Scroll to the card and expand the solution drawer
    setTimeout(() => {
        const card = document.getElementById(`card-${targetQ.id}`);
        if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            const drawer = document.getElementById(`sol-drawer-${targetQ.id}`);
            const btn = document.getElementById(`sol-btn-${targetQ.id}`);
            if (drawer) {
                drawer.style.display = "block";
                if (btn) btn.textContent = "Hide Solution";
            }
        }
    }, 300);
}

// -------------------------------------------------------------
// PRACTICE TEST MODE CONTROLLERS
// -------------------------------------------------------------

function toggleGlobalTestMode() {
    if (testModeActive) {
        if (!confirm("Are you sure you want to exit the Practice Test? Your progress will be lost.")) {
            return;
        }
        exitTestMode();
    } else {
        enterTestSetup();
    }
}

function enterTestSetup() {
    testModeActive = true;
    testReviewMode = false;
    
    // Active sidebar styling
    renderSidebar();
    
    // Hide regular layout, show test-workspace
    document.getElementById("study-workspace").style.display = "none";
    const testWs = document.getElementById("test-workspace");
    testWs.style.display = "block";
    
    // Get list of unique subjects
    const subjectsList = Array.from(new Set(QUESTIONS_DATABASE.map(q => q.subject))).sort();
    
    let html = `
        <div class="test-setup-panel">
            <h3>Practice Test Setup</h3>
            <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 20px;">
                Configure your mock exam using actual GATE previous year questions. In test mode, answer keys and explanations are locked. Score is calculated using the official GATE schema (+Marks, and -Marks/3 for incorrect MCQs).
            </p>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>Select Years</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label"><input type="checkbox" name="test-year" value="2024" checked> 2024</label>
                        <label class="checkbox-label"><input type="checkbox" name="test-year" value="2025" checked> 2025</label>
                        <label class="checkbox-label"><input type="checkbox" name="test-year" value="2026" checked> 2026</label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Question Type</label>
                    <div class="checkbox-group">
                        <label class="checkbox-label"><input type="checkbox" name="test-type" value="MCQ" checked> MCQ (Negative Marks)</label>
                        <label class="checkbox-label"><input type="checkbox" name="test-type" value="MSQ" checked> MSQ (No Penalty)</label>
                        <label class="checkbox-label"><input type="checkbox" name="test-type" value="NAT" checked> NAT (No Penalty)</label>
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom: 20px;">
                <label>Select Subjects</label>
                <div class="checkbox-group" style="grid-template-columns: 1fr;">
                    ${subjectsList.map((s, idx) => `
                        <label class="checkbox-label" style="display: flex; width: 100%;">
                            <input type="checkbox" name="test-subject" value="${s}" checked> 
                            <span>${s}</span>
                        </label>
                    `).join("")}
                </div>
            </div>
            
            <div class="form-grid" style="margin-bottom: 24px;">
                <div class="form-group">
                    <label>Number of Questions</label>
                    <select id="test-question-count">
                        <option value="5">5 Questions</option>
                        <option value="10" selected>10 Questions</option>
                        <option value="15">15 Questions</option>
                        <option value="20">20 Questions</option>
                        <option value="30">30 Questions</option>
                        <option value="55">55 Questions (Full Paper Length)</option>
                    </select>
                </div>
            </div>
            
            <div class="toggle-buttons" style="gap:12px;">
                <button class="btn btn-primary" onclick="startPracticeTest()">Start Practice Test</button>
                <button class="btn btn-secondary" onclick="exitTestMode()">Cancel</button>
            </div>
        </div>
    `;
    
    testWs.innerHTML = html;
}

function startPracticeTest() {
    // Read selections
    const years = Array.from(document.querySelectorAll('input[name="test-year"]:checked')).map(el => parseInt(el.value));
    const types = Array.from(document.querySelectorAll('input[name="test-type"]:checked')).map(el => el.value);
    const subjects = Array.from(document.querySelectorAll('input[name="test-subject"]:checked')).map(el => el.value);
    const maxCount = parseInt(document.getElementById("test-question-count").value);
    
    if (years.length === 0 || types.length === 0 || subjects.length === 0) {
        alert("Please select at least one year, question type, and subject.");
        return;
    }
    
    // Filter questions matching criteria
    let candidates = QUESTIONS_DATABASE.filter(q => {
        return years.includes(q.year) && types.includes(q.questionType) && subjects.includes(q.subject);
    });
    
    if (candidates.length === 0) {
        alert("No questions found matching your selection criteria. Try broadening options.");
        return;
    }
    
    // Shuffle candidates
    candidates.sort(() => Math.random() - 0.5);
    
    // Select count
    testQuestions = candidates.slice(0, Math.min(maxCount, candidates.length));
    testAnswers = {};
    currentTestIndex = 0;
    testElapsedTime = 0;
    testReviewMode = false;
    
    // Start timer
    if (testTimerInterval) clearInterval(testTimerInterval);
    testTimerInterval = setInterval(() => {
        testElapsedTime++;
        updateTestTimerDisplay();
    }, 1000);
    
    renderActiveTestPage();
}

function updateTestTimerDisplay() {
    const el = document.getElementById("test-timer-span");
    if (!el) return;
    
    const minutes = Math.floor(testElapsedTime / 60);
    const seconds = testElapsedTime % 60;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    const secStr = seconds < 10 ? `0${seconds}` : seconds;
    
    el.textContent = `${minStr}:${secStr}`;
}

function renderActiveTestPage() {
    const testWs = document.getElementById("test-workspace");
    if (!testWs) return;
    
    const q = testQuestions[currentTestIndex];
    const isFirst = currentTestIndex === 0;
    const isLast = currentTestIndex === testQuestions.length - 1;
    
    let html = `
        <div class="test-layout-container">
            <div class="test-header">
                <div class="test-progress-info">
                    <h2>Practice Test Active</h2>
                    <span style="font-size: 13.5px; color: var(--text-secondary);">
                        Question <strong>${currentTestIndex + 1}</strong> of <strong>${testQuestions.length}</strong>
                    </span>
                </div>
                <div class="test-timer">
                    ⏳ <span id="test-timer-span">00:00</span>
                </div>
                <button class="btn btn-warning" onclick="submitTestSession()">Submit Test</button>
            </div>
            
            <div class="question-card" style="background: none; border: none; padding: 0; box-shadow: none;">
                <div class="card-header" style="margin-bottom:14px;">
                    <span class="meta-tag year-tag">GATE DA ${q.year}</span>
                    <span class="meta-tag qnum-tag">Q. ${q.questionNumber}</span>
                    <span class="meta-tag type-tag">${q.questionType}</span>
                    <span class="meta-tag marks-tag">${q.marks} Mark${q.marks > 1 ? "s" : ""}</span>
                    <span class="meta-tag topic-tag-meta">${q.subject} · ${q.topic}</span>
                </div>
                
                <!-- Crop rendering -->
                <div class="question-image-container" style="border: 1px solid var(--card-border);">
                    <img src="${q.imageData || q.imagePath}" class="question-image" alt="Question Crop" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="question-text-fallback" style="display:none;">
                        <pre class="fallback-pre">${q.questionText}</pre>
                    </div>
                </div>
                
                <!-- Interactive Input (Test mode handles input saving) -->
                ${renderPracticeInput(q, true)}
            </div>
            
            <div class="test-navigation">
                <button class="btn btn-secondary" onclick="prevTestQuestion()" ${isFirst ? "disabled" : ""}>
                    ← Previous
                </button>
                
                <div>
                    <span style="color:var(--text-muted); font-size:13px; margin-right:10px;">
                        Answered: ${Object.keys(testAnswers).length}/${testQuestions.length}
                    </span>
                </div>
                
                <button class="btn btn-primary" onclick="nextTestQuestion()" ${isLast ? "disabled" : ""}>
                    Next →
                </button>
            </div>
        </div>
    `;
    
    testWs.innerHTML = html;
    updateTestTimerDisplay();
}

function prevTestQuestion() {
    if (currentTestIndex > 0) {
        currentTestIndex--;
        renderActiveTestPage();
    }
}

function nextTestQuestion() {
    if (currentTestIndex < testQuestions.length - 1) {
        currentTestIndex++;
        renderActiveTestPage();
    }
}

function saveTestAnswer(qId, val) {
    testAnswers[qId] = val.trim();
    // Re-render navigation stats
    renderActiveTestPage();
}

function saveTestMsqAnswer(qId, val) {
    let current = testAnswers[qId] ? testAnswers[qId].split(";") : [];
    if (current.includes(val)) {
        current = current.filter(x => x !== val);
    } else {
        current.push(val);
    }
    testAnswers[qId] = current.sort().join(";");
    renderActiveTestPage();
}

function submitTestSession() {
    if (!confirm("Are you sure you want to finish the test and submit?")) {
        return;
    }
    
    // Stop Timer
    clearInterval(testTimerInterval);
    
    // Calculate scoring
    let totalScore = 0;
    let correctCount = 0;
    testReviewData = [];
    
    testQuestions.forEach(q => {
        const userVal = testAnswers[q.id] || "";
        const isCorrect = validateAnswer(q, userVal);
        
        let earnedMarks = 0;
        if (isCorrect) {
            earnedMarks = q.marks;
            correctCount++;
        } else {
            // MCQ negative marking penalty
            if (q.questionType === "MCQ" && userVal !== "") {
                earnedMarks = -q.marks / 3;
            } else {
                earnedMarks = 0;
            }
        }
        
        totalScore += earnedMarks;
        testReviewData.push({
            q: q,
            userVal: userVal,
            isCorrect: isCorrect,
            earnedMarks: earnedMarks
        });
    });
    
    testReviewMode = true;
    renderTestResults(totalScore, correctCount);
}

function renderTestResults(score, correctCount) {
    const testWs = document.getElementById("test-workspace");
    if (!testWs) return;
    
    const accuracy = testQuestions.length > 0 ? (correctCount / testQuestions.length) * 100 : 0;
    
    // Format timer
    const min = Math.floor(testElapsedTime / 60);
    const sec = testElapsedTime % 60;
    const timeStr = `${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`;
    
    let html = `
        <div class="test-layout-container results-card">
            <h2>Mock Test Results</h2>
            <p style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;">
                GATE DA PYQ Practice Exam Completed.
            </p>
            
            <div class="results-metrics">
                <div class="metric-circle score">
                    <span class="metric-value">${score.toFixed(2)}</span>
                    <span class="metric-label">GATE Score</span>
                </div>
                
                <div class="metric-circle accuracy">
                    <span class="metric-value">${accuracy.toFixed(0)}%</span>
                    <span class="metric-label">Accuracy</span>
                </div>
                
                <div class="metric-circle">
                    <span class="metric-value">${timeStr}</span>
                    <span class="metric-label">Time Taken</span>
                </div>
            </div>
            
            <div style="font-size:13.5px; color:var(--text-secondary); margin-bottom: 24px;">
                Answered <strong>${correctCount}</strong> correct out of <strong>${testQuestions.length}</strong> questions.
            </div>
            
            <div class="results-list-table">
                <h3>Detailed Question Audit</h3>
                <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:12px;">
                    Click on any question row below to load it in study mode, examine its page, and reveal its complete step-by-step solution.
                </p>
                <div class="dash-list">
                    ${testReviewData.map((rd, idx) => `
                        <div class="review-item" onclick="selectAndReviewQuestion('${rd.q.questionNumber}', ${rd.q.year})">
                            <div class="review-info">
                                <div class="review-status-dot ${rd.isCorrect ? "correct" : "incorrect"}"></div>
                                <div class="review-meta">
                                    <strong>Q. ${rd.q.questionNumber} (${rd.q.year})</strong> ·
                                    <span>Type: ${rd.q.questionType}</span> ·
                                    <span>Marks earned: ${rd.earnedMarks.toFixed(2)}/${rd.q.marks}</span>
                                    <span class="review-topic">(${rd.q.topic})</span>
                                </div>
                            </div>
                            <div class="review-action">Review Solution →</div>
                        </div>
                    `).join("")}
                </div>
            </div>
            
            <div class="toggle-buttons" style="justify-content: center; margin-top: 30px;">
                <button class="btn btn-primary" onclick="exitTestMode()">Back to Study Mode</button>
            </div>
        </div>
    `;
    
    testWs.innerHTML = html;
}

function exitTestMode() {
    testModeActive = false;
    testReviewMode = false;
    if (testTimerInterval) {
        clearInterval(testTimerInterval);
        testTimerInterval = null;
    }
    
    document.getElementById("study-workspace").style.display = "block";
    document.getElementById("test-workspace").style.display = "none";
    
    renderSidebar();
    renderContent();
}

// -------------------------------------------------------------
// PDF GENERATION LOGIC WITH embedded base64 (CORS COMPLIANT)
// -------------------------------------------------------------

function downloadQuestionPDF(qId) {
    const q = QUESTIONS_DATABASE.find(x => x.id === qId);
    if (!q) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    
    const img = new Image();
    // Load Base64 image directly - this eliminates local CORS errors completely!
    img.src = q.imageData;
    img.onload = function() {
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(`GATE DA ${q.year}`, 48, 50);
        doc.text(`Question Number: ${q.questionNumber}`, 48, 68);
        doc.text(`Marks: ${q.marks}`, pw - 48, 50, { align: "right" });
        doc.text(`Type: ${q.questionType}`, pw - 48, 68, { align: "right" });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(1);
        doc.line(48, 80, pw - 48, 80);
        
        const maxW = pw - 96;
        const maxH = ph - 150;
        
        let targetW = img.width;
        let targetH = img.height;
        
        if (targetW > maxW) {
            const scaleRatio = maxW / targetW;
            targetW = maxW;
            targetH = targetH * scaleRatio;
        }
        
        if (targetH > maxH) {
            const scaleRatio = maxH / targetH;
            targetH = maxH;
            targetW = targetW * scaleRatio;
        }
        
        const xPos = (pw - targetW) / 2;
        doc.addImage(q.imageData, "PNG", xPos, 100, targetW, targetH);
        
        doc.save(`GATE-DA-${q.year}-Q${q.questionNumber}.pdf`);
    };
    img.onerror = function() {
        // Fallback
        const pw = doc.internal.pageSize.getWidth();
        doc.setFont("helvetica", "bold");
        doc.text(`GATE DA ${q.year} — Q.${q.questionNumber}`, 48, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(q.questionText, pw - 96);
        doc.text(splitText, 48, 100);
        doc.save(`GATE-DA-${q.year}-Q${q.questionNumber}.pdf`);
    };
}

function downloadSubjectPDF(subjectName) {
    const questions = QUESTIONS_DATABASE.filter(q => q.subject === subjectName)
        .sort((a, b) => a.year - b.year || a.questionNumber - b.questionNumber);
        
    if (questions.length === 0) {
        alert("No questions found in this subject.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    
    // Draw Cover Page
    doc.setFillColor(16, 29, 46);
    doc.rect(0, 0, pw, ph, "F");
    
    doc.setTextColor(217, 164, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("GATE DATA SCIENCE & ARTIFICIAL INTELLIGENCE", 48, 120);
    
    doc.setTextColor(250, 245, 232);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    const titleLines = doc.splitTextToSize(subjectName, pw - 96);
    doc.text(titleLines, 48, 160);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(185, 196, 214);
    doc.text(`Consolidated Question Bank (2024–2026)`, 48, 260);
    doc.text(`Total Questions: ${questions.length}`, 48, 280);
    
    doc.setDrawColor(217, 164, 65);
    doc.setLineWidth(1);
    doc.line(48, 720, pw - 48, 720);
    
    doc.setFontSize(9);
    doc.setTextColor(150, 160, 180);
    doc.text("Generated by GATE DA PYQ Platform. Clean copy: answers and solutions are excluded.", 48, 745);
    doc.text("Original question layouts preserved as high-fidelity image crops.", 48, 760);
    
    let currentIdx = 0;
    
    function addNextQuestion() {
        if (currentIdx >= questions.length) {
            doc.save(`GATE-DA_${subjectName.replace(/[^a-z0-9]+/gi, "-")}_2024-2026.pdf`);
            return;
        }
        
        const q = questions[currentIdx];
        doc.addPage();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(`GATE DA ${q.year}`, 48, 50);
        doc.text(`Question Number: ${q.questionNumber}`, 48, 68);
        doc.text(`Marks: ${q.marks}`, pw - 48, 50, { align: "right" });
        doc.text(`Type: ${q.questionType}`, pw - 48, 68, { align: "right" });
        
        doc.setDrawColor(200, 200, 200);
        doc.line(48, 80, pw - 48, 80);
        
        const img = new Image();
        img.src = q.imageData;
        img.onload = function() {
            const maxW = pw - 96;
            const maxH = ph - 150;
            let targetW = img.width;
            let targetH = img.height;
            
            if (targetW > maxW) {
                const scaleRatio = maxW / targetW;
                targetW = maxW;
                targetH = targetH * scaleRatio;
            }
            if (targetH > maxH) {
                const scaleRatio = maxH / targetH;
                targetH = maxH;
                targetW = targetW * scaleRatio;
            }
            
            const xPos = (pw - targetW) / 2;
            doc.addImage(q.imageData, "PNG", xPos, 100, targetW, targetH);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${doc.internal.getNumberOfPages()}`, pw - 48, ph - 30, { align: "right" });
            doc.text(`${subjectName} · Clean Question Copy`, 48, ph - 30);
            
            currentIdx++;
            addNextQuestion();
        };
        img.onerror = function() {
            doc.text(q.questionText, 48, 100);
            currentIdx++;
            addNextQuestion();
        };
    }
    
    addNextQuestion();
}

// -------------------------------------------------------------
// GATE CSE STUDY SEQUENCE & READINESS SIMULATOR ENGINE
// -------------------------------------------------------------

const simPhases = [
    {
        id: 1,
        name: "Phase 1: PDS + Digital Logic",
        strategy: "Heavy Problem Solving + Compact Foundation for COA",
        targetHours: 215,
        completedHours: 0,
        marks: 15.1,
        subjects: ["PDS", "Digital Logic"]
    },
    {
        id: 2,
        name: "Phase 2: Algorithms + DBMS",
        strategy: "PDS-Benefited Algo + High-ROI Recurring DBMS",
        targetHours: 240,
        completedHours: 0,
        marks: 15.3,
        subjects: ["Algorithms", "DBMS"]
    },
    {
        id: 3,
        name: "Phase 3: TOC + Compiler Design",
        strategy: "Strongest Pure Academic Synergy (Automata fresh for Parsing)",
        targetHours: 190,
        completedHours: 0,
        marks: 12.8,
        subjects: ["TOC", "Compiler Design"]
    },
    {
        id: 4,
        name: "Phase 4: COA + Operating Systems",
        strategy: "DL-Mature Dependency + Deep System Intersections",
        targetHours: 240,
        completedHours: 0,
        marks: 17.5,
        subjects: ["COA", "Operating Systems"]
    },
    {
        id: 5,
        name: "Phase 5: CN + Engineering Mathematics",
        strategy: "Protocols & Distributed Reasoning + Math PYQ Consolidation",
        targetHours: 220,
        completedHours: 0,
        marks: 23.3,
        subjects: ["Computer Networks", "Engineering Mathematics"]
    },
    {
        id: 6,
        name: "Final 3 Weeks: Pure PYQs + Mocks + Error Log",
        strategy: "Zero new lectures. Timed mock tests, NAT drills, MSQ traps",
        targetHours: 115,
        completedHours: 0,
        marks: 16.0,
        subjects: ["Mock Tests", "Error Log"]
    }
];

const simPyqTopics = [
    { name: "Graph Theory", subject: "Maths", count: 115, phase: 5 },
    { name: "SQL", subject: "DBMS", count: 115, phase: 2 },
    { name: "OSI Model", subject: "CN", count: 111, phase: 5 },
    { name: "Pointers & Recursion", subject: "PDS", count: 109, phase: 1 },
    { name: "Lexical & Parsing", subject: "Compiler", count: 176, phase: 3 },
    { name: "Graph Algorithms", subject: "Algo", count: 86, phase: 2 },
    { name: "Cache Memory", subject: "COA", count: 72, phase: 4 },
    { name: "B / B+ Trees", subject: "DBMS", count: 68, phase: 2 },
    { name: "Deadlocks & Semaphores", subject: "OS", count: 53, phase: 4 }
];

let simCurrentDay = 0;
let simTotalHours = 0;
let simActivePhaseIndex = 0;

function renderSimulator() {
    const kpiDay = document.getElementById("kpi-day");
    if (!kpiDay) return;

    // Render KPIs
    kpiDay.textContent = `Day ${simCurrentDay}`;
    const kpiHours = document.getElementById("kpi-hours");
    if (kpiHours) kpiHours.textContent = simTotalHours.toFixed(1);

    // Calculate score
    let acquiredMarks = 0;
    let pyqsMastered = 0;

    simPhases.forEach((p) => {
        const frac = Math.min(1, p.completedHours / p.targetHours);
        acquiredMarks += frac * p.marks;
        if (frac >= 0.95) {
            simPyqTopics.filter(t => t.phase === p.id).forEach(t => pyqsMastered += t.count);
        }
    });

    const finalMarks = Math.min(100, acquiredMarks).toFixed(1);
    const kpiScore = document.getElementById("kpi-score");
    if (kpiScore) kpiScore.textContent = `${finalMarks} / 100`;

    // Projected Rank
    let rankText = "Projected: Not qualified";
    if (finalMarks >= 75) rankText = "Projected: AIR < 100 🎯";
    else if (finalMarks >= 65) rankText = "Projected: AIR 100 - 300 🚀";
    else if (finalMarks >= 55) rankText = "Projected: AIR 300 - 700 📈";
    else if (finalMarks >= 40) rankText = "Projected: AIR 1000 - 2500";
    else if (finalMarks >= 25) rankText = "Projected: Qualified (~28-32 Cutoff)";

    const kpiRank = document.getElementById("kpi-rank");
    if (kpiRank) kpiRank.textContent = rankText;

    // Phase KPI
    const kpiPhase = document.getElementById("kpi-phase");
    const kpiSubpair = document.getElementById("kpi-subpair");
    if (simActivePhaseIndex < simPhases.length) {
        if (kpiPhase) kpiPhase.textContent = simPhases[simActivePhaseIndex].name;
        if (kpiSubpair) kpiSubpair.textContent = simPhases[simActivePhaseIndex].strategy;
    } else {
        if (kpiPhase) kpiPhase.textContent = "Exam Ready!";
        if (kpiSubpair) kpiSubpair.textContent = "All 5.5h blocks completed";
    }

    const kpiPyq = document.getElementById("kpi-pyq");
    if (kpiPyq) kpiPyq.textContent = `${pyqsMastered} / 895`;

    // Render Phases List
    const container = document.getElementById("phase-container");
    if (container) {
        container.innerHTML = "";

        simPhases.forEach((phase, idx) => {
            const pct = Math.min(100, Math.round((phase.completedHours / phase.targetHours) * 100));
            const isCurrent = idx === simActivePhaseIndex;
            const isDone = pct === 100;

            const div = document.createElement("div");
            div.className = `phase-card ${isCurrent ? 'active' : ''}`;
            div.innerHTML = `
                <div class="phase-header">
                    <span class="phase-title">${phase.name}</span>
                    <span style="font-size: 0.8rem; color: ${isDone ? 'var(--sim-success, #22c55e)' : 'var(--sim-text-muted, #94a3b8)'}">
                        ${isDone ? 'COMPLETED' : `${phase.completedHours.toFixed(1)} / ${phase.targetHours} hrs (${pct}%)`}
                    </span>
                </div>
                <p style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 6px;">${phase.strategy}</p>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${pct}%; background: ${isDone ? 'var(--sim-success, #22c55e)' : 'var(--sim-primary, #38bdf8)'}"></div>
                </div>
                <div class="phase-meta">
                    <span>Subjects: ${phase.subjects.join(", ")}</span>
                    <span>Expected Weight: ~${phase.marks} Marks</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // Render PYQ Table
    const tbody = document.getElementById("pyq-table-body");
    if (tbody) {
        tbody.innerHTML = "";
        simPyqTopics.forEach(topic => {
            const phase = simPhases[topic.phase - 1];
            const isDone = (phase.completedHours / phase.targetHours) >= 0.95;
            const inProgress = simActivePhaseIndex === (topic.phase - 1);

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${topic.name}</strong></td>
                <td><span class="tag">${topic.subject}</span></td>
                <td>${topic.count} PYQs</td>
                <td>
                    <span style="color: ${isDone ? 'var(--sim-success, #22c55e)' : (inProgress ? 'var(--sim-warning, #f59e0b)' : 'var(--sim-text-muted, #94a3b8)')}">
                        ${isDone ? '✓ Mastered' : (inProgress ? '● In Progress' : 'Pending')}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function simulateDays(days) {
    for (let d = 0; d < days; d++) {
        if (simActivePhaseIndex >= simPhases.length) break;

        simCurrentDay += 1;
        const dailyHours = 5.5; // 5.5 hour architecture
        simTotalHours += dailyHours;

        simPhases[simActivePhaseIndex].completedHours += dailyHours;

        if (simPhases[simActivePhaseIndex].completedHours >= simPhases[simActivePhaseIndex].targetHours) {
            simPhases[simActivePhaseIndex].completedHours = simPhases[simActivePhaseIndex].targetHours;
            simActivePhaseIndex += 1;
        }
    }
    renderSimulator();
}

function resetSim() {
    simCurrentDay = 0;
    simTotalHours = 0;
    simActivePhaseIndex = 0;
    simPhases.forEach(p => p.completedHours = 0);
    renderSimulator();
}

function scrollToSimulator() {
    if (typeof exitTestMode === "function" && testModeActive) {
        exitTestMode();
    }
    const studyWs = document.getElementById("study-workspace");
    const testWs = document.getElementById("test-workspace");
    if (studyWs) studyWs.style.display = "block";
    if (testWs) testWs.style.display = "none";
    
    const el = document.getElementById("gate-cse-simulator");
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Global Exports
window.simulateDays = simulateDays;
window.resetSim = resetSim;
window.renderSimulator = renderSimulator;
window.scrollToSimulator = scrollToSimulator;

