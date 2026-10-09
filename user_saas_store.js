/**
 * GATEGuide SaaS User Identity & Activity Logging Engine
 * Zero-Friction (No Registration, No Password, No Paywall)
 * Persistent Candidate Profile, Activity Timeline & Study Performance Tracker
 */

class UserSaaSStore {
    constructor() {
        this.STORAGE_KEY = "GATE_GUIDE_SAAS_USER_PROFILE_V1";
        this.LOGS_KEY = "GATE_GUIDE_SAAS_ACTIVITY_LOGS_V1";
        
        this.profile = this.loadProfile();
        this.logs = this.loadLogs();
        
        // Touch streak and activity on load
        this.updateStreak();
    }

    /**
     * Load or initialize persistent Candidate Profile
     */
    loadProfile() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn("Could not read profile from localStorage:", e);
        }

        // Default Auto-Generated Candidate Profile
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const newProfile = {
            candidateId: `GATE-ASPIRANT-${randomId}`,
            displayName: `Aspirant #${randomId}`,
            targetYear: "2027",
            targetGoal: "AIR < 100 (75+ Marks)",
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            streakDays: 1,
            lastStreakDate: new Date().toDateString(),
            questionsAttempted: 0,
            questionsCorrect: 0,
            testsCompleted: 0,
            totalStudyMinutes: 0
        };

        this.saveProfile(newProfile);
        return newProfile;
    }

    /**
     * Save Candidate Profile
     */
    saveProfile(profileData = this.profile) {
        this.profile = profileData;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile));
        } catch (e) {
            console.warn("LocalStorage save error:", e);
        }
        this.notifyUI();
    }

    /**
     * Load Activity Logs
     */
    loadLogs() {
        try {
            const raw = localStorage.getItem(this.LOGS_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn("Could not read logs from localStorage:", e);
        }

        // Default Initial Activity Log
        const initialLog = [{
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: "SYSTEM_INIT",
            title: "SaaS Account Initialized",
            details: "Instant anonymous SaaS workspace activated. Progress auto-sync enabled.",
            badge: "⚡ System"
        }];
        this.saveLogs(initialLog);
        return initialLog;
    }

    /**
     * Save Logs
     */
    saveLogs(logsArray = this.logs) {
        this.logs = logsArray;
        try {
            localStorage.setItem(this.LOGS_KEY, JSON.stringify(this.logs));
        } catch (e) {
            console.warn("LocalStorage logs save error:", e);
        }
        this.notifyUI();
    }

    /**
     * Log a Candidate Activity Entry
     */
    logActivity(type, title, details, badge = "🎯 Activity", meta = {}) {
        const entry = {
            id: `log_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            timestamp: new Date().toISOString(),
            type,
            title,
            details,
            badge,
            meta
        };

        // Prepend new log
        this.logs.unshift(entry);

        // Keep last 150 log entries to preserve memory
        if (this.logs.length > 150) {
            this.logs = this.logs.slice(0, 150);
        }

        // Update profile metrics based on activity type
        if (type === "QUESTION_ATTEMPT") {
            this.profile.questionsAttempted++;
            if (meta.isCorrect) this.profile.questionsCorrect++;
        } else if (type === "TEST_COMPLETE") {
            this.profile.testsCompleted++;
        }

        this.profile.lastActive = new Date().toISOString();
        this.saveProfile();
        this.saveLogs();
    }

    /**
     * Daily Streak Calculation
     */
    updateStreak() {
        const todayStr = new Date().toDateString();
        const lastDateStr = this.profile.lastStreakDate;

        if (lastDateStr === todayStr) {
            return; // Already recorded today
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDateStr === yesterdayStr) {
            this.profile.streakDays += 1;
        } else {
            this.profile.streakDays = 1;
        }

        this.profile.lastStreakDate = todayStr;
        this.profile.lastActive = new Date().toISOString();
        this.saveProfile();
    }

    /**
     * Update Candidate Profile Info
     */
    updateProfileInfo(displayName, targetYear, targetGoal) {
        if (displayName) this.profile.displayName = displayName.trim();
        if (targetYear) this.profile.targetYear = targetYear;
        if (targetGoal) this.profile.targetGoal = targetGoal.trim();

        this.saveProfile();
        this.logActivity("PROFILE_UPDATE", "Profile Customization Updated", `Name: ${this.profile.displayName} | Goal: ${this.profile.targetGoal}`, "⚙️ Profile");
    }

    /**
     * Export Full User Data as JSON Backup File
     */
    exportProfileJSON() {
        const backupObj = {
            app: "GATEGuide SaaS",
            version: "1.0",
            exportDate: new Date().toISOString(),
            profile: this.profile,
            logs: this.logs,
            userAnswers: window.userAnswers || {},
            submittedAnswers: window.submittedAnswers || {}
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
        const dl = document.createElement("a");
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", `${this.profile.candidateId}_Progress_Backup.json`);
        document.body.appendChild(dl);
        dl.click();
        dl.remove();

        this.logActivity("DATA_EXPORT", "Exported User Profile Backup", "Saved full JSON progress backup to local disk.", "💾 Backup");
    }

    /**
     * Import User Data from JSON Backup
     */
    importProfileJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data && data.profile) {
                this.profile = data.profile;
                if (Array.isArray(data.logs)) this.logs = data.logs;
                this.saveProfile();
                this.saveLogs();

                if (data.userAnswers) window.userAnswers = data.userAnswers;
                if (data.submittedAnswers) window.submittedAnswers = data.submittedAnswers;

                alert("✅ SaaS Profile & Study Logs imported successfully!");
                this.logActivity("DATA_IMPORT", "Imported User Profile Backup", "Successfully restored candidate profile and study logs.", "📥 Restore");
                return true;
            }
        } catch (e) {
            alert("❌ Invalid JSON profile file format.");
        }
        return false;
    }

    /**
     * UI Listener registration
     */
    setUICallback(cb) {
        this.uiCallback = cb;
    }

    notifyUI() {
        if (this.uiCallback) this.uiCallback(this.profile, this.logs);
        const widget = document.getElementById("saas-user-badge");
        if (widget) widget.innerHTML = this.getBadgeHTML();
    }

    /**
     * Get HTML for top header badge
     */
    getBadgeHTML() {
        const initials = this.profile.displayName.substring(0, 2).toUpperCase();
        const accuracy = this.profile.questionsAttempted > 0 ? 
            ((this.profile.questionsCorrect / this.profile.questionsAttempted) * 100).toFixed(0) : 0;

        return `
            <div class="saas-user-badge-inner" onclick="window.gateSaaSStore.openProfileModal()" title="View Candidate Profile & Activity Logs">
                <div class="avatar-circle">${initials}</div>
                <div class="user-meta">
                    <span class="user-name">${this.profile.displayName}</span>
                    <span class="user-streak">🔥 ${this.profile.streakDays} Day Streak · ${accuracy}% Accuracy</span>
                </div>
            </div>
        `;
    }

    /**
     * Open Profile & Activity Logs Modal
     */
    openProfileModal() {
        let modal = document.getElementById("saas-profile-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "saas-profile-modal";
            modal.className = "saas-modal-overlay";
            document.body.appendChild(modal);
        }

        const accuracy = this.profile.questionsAttempted > 0 ? 
            ((this.profile.questionsCorrect / this.profile.questionsAttempted) * 100).toFixed(1) : "0.0";

        const logsHTML = this.logs.slice(0, 30).map(log => {
            const timeAgo = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
            return `
                <div class="log-timeline-item">
                    <div class="log-badge">${log.badge || '📌'}</div>
                    <div class="log-content">
                        <div class="log-header">
                            <span class="log-title">${log.title}</span>
                            <span class="log-time">${timeAgo}</span>
                        </div>
                        <p class="log-details">${log.details}</p>
                    </div>
                </div>
            `;
        }).join("");

        modal.innerHTML = `
            <div class="saas-modal-card">
                <div class="modal-header">
                    <h2>👤 Candidate SaaS Profile & Activity Logs</h2>
                    <button class="modal-close-btn" onclick="window.gateSaaSStore.closeProfileModal()">✕</button>
                </div>
                
                <div class="modal-body">
                    <!-- Profile Card Header -->
                    <div class="profile-summary-box">
                        <div class="profile-identity">
                            <div class="profile-avatar">${this.profile.displayName.substring(0, 2).toUpperCase()}</div>
                            <div>
                                <h3 id="modal-display-name">${this.profile.displayName}</h3>
                                <p class="id-tag">ID: <code>${this.profile.candidateId}</code> · Target GATE ${this.profile.targetYear}</p>
                            </div>
                        </div>
                        <div class="profile-badge-pill">
                            🔥 ${this.profile.streakDays} Day Streak
                        </div>
                    </div>

                    <!-- Lifetime Stats Grid -->
                    <div class="stats-counter-grid">
                        <div class="stat-box">
                            <span class="stat-val">${this.profile.questionsAttempted}</span>
                            <span class="stat-lbl">Questions Attempted</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-val">${accuracy}%</span>
                            <span class="stat-lbl">Accuracy Rate</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-val">${this.profile.testsCompleted}</span>
                            <span class="stat-lbl">Mock Tests Taken</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-val">Free SaaS</span>
                            <span class="stat-lbl">No Signup Required</span>
                        </div>
                    </div>

                    <!-- Edit Profile Form -->
                    <div class="profile-edit-section">
                        <h4>⚙️ Customize Candidate Details</h4>
                        <div class="edit-inputs-row">
                            <input type="text" id="input-edit-name" placeholder="Display Name" value="${this.profile.displayName}">
                            <select id="input-edit-year">
                                <option value="2025" ${this.profile.targetYear === "2025" ? "selected" : ""}>GATE 2025</option>
                                <option value="2026" ${this.profile.targetYear === "2026" ? "selected" : ""}>GATE 2026</option>
                                <option value="2027" ${this.profile.targetYear === "2027" ? "selected" : ""}>GATE 2027</option>
                            </select>
                            <input type="text" id="input-edit-goal" placeholder="Target Rank Goal" value="${this.profile.targetGoal}">
                            <button class="btn btn-primary" onclick="window.gateSaaSStore.handleProfileSave()">Save Profile</button>
                        </div>
                    </div>

                    <!-- Activity Log Timeline -->
                    <div class="activity-timeline-section">
                        <div class="section-title-row">
                            <h4>📜 Recent Activity Logs</h4>
                            <div class="actions-group">
                                <button class="btn btn-secondary btn-sm" onclick="window.gateSaaSStore.exportProfileJSON()">💾 Backup JSON</button>
                                <button class="btn btn-secondary btn-sm" onclick="window.gateSaaSStore.handleImportClick()">📥 Restore Backup</button>
                            </div>
                        </div>
                        <div class="timeline-container">
                            ${logsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = "flex";
    }

    handleProfileSave() {
        const name = document.getElementById("input-edit-name").value;
        const year = document.getElementById("input-edit-year").value;
        const goal = document.getElementById("input-edit-goal").value;
        this.updateProfileInfo(name, year, goal);
        alert("✅ Candidate profile updated successfully!");
        this.openProfileModal(); // Refresh modal
    }

    handleImportClick() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = event => {
                    if (this.importProfileJSON(event.target.result)) {
                        this.openProfileModal();
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    closeProfileModal() {
        const modal = document.getElementById("saas-profile-modal");
        if (modal) modal.style.display = "none";
    }
}

// Instantiate Global SaaS User Store Singleton
window.gateSaaSStore = new UserSaaSStore();
