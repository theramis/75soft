// --- State Management ---
const STORAGE_KEY = '75soft_state';

let state = {
    tasks: [],
    startDate: null,
    checkIns: {},
    animationStyle: 'smooth',
    remindersEnabled: false,
    reminderTime: '20:00'
};

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse state", e);
        }
    }
}

// --- Date Utilities ---
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDaysDifference(dateStr1, dateStr2) {
    const d1 = new Date(dateStr1 + 'T00:00:00');
    const d2 = new Date(dateStr2 + 'T00:00:00');
    const diffTime = d2 - d1;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// --- DOM Elements ---
const setupView = document.getElementById('setup-view');
const dashboardView = document.getElementById('dashboard-view');

// Setup UI
const newTaskInput = document.getElementById('new-task-input');
const newTargetInput = document.getElementById('new-task-target');
const addTaskBtn = document.getElementById('add-task-btn');
const setupTaskList = document.getElementById('setup-task-list');
const startChallengeBtn = document.getElementById('start-challenge-btn');

// Dashboard UI
const currentDayLabel = document.getElementById('current-day-label');
const todayDateText = document.getElementById('today-date-text');
const dashboardTaskList = document.getElementById('dashboard-task-list');
const progressCircle = document.querySelector('.progress-ring__circle');

// Modals
const settingsModal = document.getElementById('settings-modal');
const gracePromptModal = document.getElementById('grace-prompt-modal');
const uncheckModal = document.getElementById('uncheck-modal');
const failureModal = document.getElementById('failure-modal');
const successModal = document.getElementById('success-modal');

// --- Initialization ---
function init() {
    loadState();
    applyTheme();

    if (!state.startDate || state.tasks.length === 0) {
        showSetup();
    } else {
        checkDateLogic();
    }
    
    if (state.remindersEnabled) {
        scheduleNextNotification();
    }
}

// --- UI Logic ---
function showSetup() {
    setupView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    renderSetupTasks();
}

function showDashboard() {
    setupView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderDashboardTasks();
    updateProgressUI();
}

function applyTheme() {
    document.body.className = `theme-${state.animationStyle}`;
    document.getElementById('animation-style-select').value = state.animationStyle;
}

// --- Setup Interactions ---
addTaskBtn.addEventListener('click', () => {
    const taskText = newTaskInput.value.trim();
    const targetValue = parseInt(newTargetInput.value, 10);
    const target = (!isNaN(targetValue) && targetValue > 0) ? targetValue : null;

    if (taskText) {
        state.tasks.push({ text: taskText, target: target });
        newTaskInput.value = '';
        newTargetInput.value = '';
        saveState();
        renderSetupTasks();
    }
});

newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTaskBtn.click();
});

function renderSetupTasks() {
    setupTaskList.innerHTML = '';
    state.tasks.forEach((taskObj, index) => {
        const text = typeof taskObj === 'string' ? taskObj : taskObj.text;
        const target = typeof taskObj === 'string' ? null : taskObj.target;
        const targetHtml = target ? `<span class="setup-target-badge">Goal: ${target}</span>` : '';

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="setup-task-info">
                <span class="task-text-setup">${text}</span>
                ${targetHtml}
            </div>
            <button class="delete-task-btn" onclick="deleteSetupTask(${index})" aria-label="Delete">✖</button>
        `;
        setupTaskList.appendChild(li);
    });
    startChallengeBtn.disabled = state.tasks.length === 0;
}

window.deleteSetupTask = (index) => {
    state.tasks.splice(index, 1);
    saveState();
    renderSetupTasks();
};

startChallengeBtn.addEventListener('click', () => {
    if (state.tasks.length === 0) return;
    state.startDate = getLocalDateString(new Date());
    state.checkIns = {};
    saveState();
    showDashboard();
});

// --- Dashboard Logic ---
function isDayComplete(dateStr) {
    const dayCheckIns = state.checkIns[dateStr] || {};
    for (let i = 0; i < state.tasks.length; i++) {
        const taskObj = state.tasks[i];
        const target = typeof taskObj === 'string' ? null : taskObj.target;
        const val = dayCheckIns[i];
        
        if (target) {
            let progress = typeof val === 'number' ? val : (val ? target : 0);
            if (progress < target) return false;
        } else {
            if (!val) return false;
        }
    }
    return true;
}

function checkDateLogic() {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const startStr = state.startDate;

    const daysPassed = getDaysDifference(startStr, todayStr);
    const currentDayNum = daysPassed + 1;

    // Check history up to yesterday
    let failed = false;
    let missingYesterday = false;
    let yesterdayStr = null;

    for (let i = 0; i < daysPassed; i++) {
        const checkDate = new Date(startStr + 'T00:00:00');
        checkDate.setDate(checkDate.getDate() + i);
        const checkDateStr = getLocalDateString(checkDate);
        
        if (!isDayComplete(checkDateStr)) {
            if (i === daysPassed - 1) { // It's yesterday
                missingYesterday = true;
                yesterdayStr = checkDateStr;
            } else {
                failed = true;
                break;
            }
        }
    }

    if (failed) {
        showFailureModal();
        return;
    }

    if (missingYesterday) {
        showGracePrompt(yesterdayStr);
        return;
    }

    if (currentDayNum > 75) {
        showSuccessModal();
        return;
    }

    showDashboard();
}

function updateProgressUI() {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const daysPassed = getDaysDifference(state.startDate, todayStr);
    const currentDayNum = Math.min(daysPassed + 1, 75);
    
    currentDayLabel.textContent = `Day ${currentDayNum}`;
    
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    todayDateText.textContent = today.toLocaleDateString(undefined, options);

    // Update SVG Circle
    const radius = progressCircle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    // Calculate offset based on completion of current day + past days
    let completedDaysCount = 0;
    for (let i = 0; i < currentDayNum; i++) {
        const d = new Date(state.startDate + 'T00:00:00');
        d.setDate(d.getDate() + i);
        if (isDayComplete(getLocalDateString(d))) {
            completedDaysCount++;
        }
    }

    const offset = circumference - (completedDaysCount / 75) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

function renderDashboardTasks() {
    dashboardTaskList.innerHTML = '';
    const todayStr = getLocalDateString(new Date());
    const dayCheckIns = state.checkIns[todayStr] || {};

    state.tasks.forEach((taskObj, index) => {
        const text = typeof taskObj === 'string' ? taskObj : taskObj.text;
        const target = typeof taskObj === 'string' ? null : taskObj.target;
        
        let progress = dayCheckIns[index];
        let isCompleted = false;
        
        if (target) {
            if (typeof progress !== 'number') progress = progress ? target : 0;
            isCompleted = progress >= target;
        } else {
            isCompleted = !!progress;
        }

        const li = document.createElement('li');
        li.className = `task-item ${isCompleted ? 'completed' : ''}`;
        
        if (target) {
            // Calculate SVG circle properties for progress ring
            const radius = 13; // half of 28px - 1px border
            const circumference = radius * 2 * Math.PI;
            const progressRatio = isCompleted ? 1 : (progress / target);
            const offset = circumference - (progressRatio * circumference);
            
            // Only show the progress ring if not completed (when completed, it turns solid green)
            const ringHtml = !isCompleted && progress > 0 ? `
                <svg class="task-progress-ring" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="${radius}" stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${offset}"></circle>
                </svg>
            ` : '';

            li.innerHTML = `
                <div class="task-checkbox">${ringHtml}</div>
                <span class="task-text">${text}</span>
                <div class="progress-controls" onclick="event.stopPropagation()">
                    <button class="progress-btn minus" onclick="handleProgressChange(${index}, -1, '${todayStr}', ${target})">-</button>
                    <span class="progress-text-display">${progress} / ${target}</span>
                    <button class="progress-btn plus" onclick="handleProgressChange(${index}, 1, '${todayStr}', ${target})">+</button>
                </div>
            `;
            li.addEventListener('click', () => {
                if (isCompleted) {
                    handleTaskToggle(index, isCompleted, todayStr, true, target);
                } else {
                    handleProgressChange(index, 1, todayStr, target);
                }
            });
        } else {
            li.innerHTML = `
                <div class="task-checkbox"></div>
                <span class="task-text">${text}</span>
            `;
            li.addEventListener('click', () => handleTaskToggle(index, isCompleted, todayStr, false, null));
        }

        dashboardTaskList.appendChild(li);
    });
}

let pendingUncheckIndex = null;
let pendingUncheckDateStr = null;
let pendingUncheckNextValue = null;

window.handleProgressChange = (index, delta, dateStr, target) => {
    if (!state.checkIns[dateStr]) state.checkIns[dateStr] = {};
    let current = state.checkIns[dateStr][index];
    if (typeof current !== 'number') current = current ? target : 0;
    
    let next = current + delta;
    next = Math.max(0, Math.min(next, target));
    
    if (current >= target && next < target) {
        pendingUncheckIndex = index;
        pendingUncheckDateStr = dateStr;
        pendingUncheckNextValue = next;
        uncheckModal.classList.remove('hidden');
        return;
    }
    
    if (next !== current) {
        updateCheckIn(dateStr, index, next, target);
    }
};

function updateCheckIn(dateStr, index, value, target) {
    if (!state.checkIns[dateStr]) state.checkIns[dateStr] = {};
    state.checkIns[dateStr][index] = value;
    saveState();
    renderDashboardTasks();
    updateProgressUI();
    if (target ? value >= target : value) {
        checkIfDay75Completed();
    }
    if (state.remindersEnabled) scheduleNextNotification();
}

function handleTaskToggle(index, isCompleted, dateStr, isNumeric = false, target = null) {
    if (isCompleted) {
        pendingUncheckIndex = index;
        pendingUncheckDateStr = dateStr;
        pendingUncheckNextValue = isNumeric ? (target ? target - 1 : 0) : false;
        uncheckModal.classList.remove('hidden');
    } else {
        if (isNumeric && target) {
            handleProgressChange(index, 1, dateStr, target);
        } else {
            updateCheckIn(dateStr, index, true, null);
        }
    }
}

document.getElementById('uncheck-confirm-btn').addEventListener('click', () => {
    if (pendingUncheckIndex !== null && pendingUncheckDateStr) {
        state.checkIns[pendingUncheckDateStr][pendingUncheckIndex] = pendingUncheckNextValue;
        saveState();
        renderDashboardTasks();
        updateProgressUI();
        if (state.remindersEnabled) scheduleNextNotification();
    }
    closeModal(uncheckModal);
});

document.getElementById('uncheck-cancel-btn').addEventListener('click', () => {
    closeModal(uncheckModal);
});

function checkIfDay75Completed() {
    const todayStr = getLocalDateString(new Date());
    const daysPassed = getDaysDifference(state.startDate, todayStr);
    if (daysPassed === 74 && isDayComplete(todayStr)) {
        showSuccessModal();
    }
}

// --- Modals Logic ---
function closeModal(modal) {
    modal.classList.add('hidden');
}

document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal-overlay'));
    });
});

// Grace Prompt
let graceDateStr = null;
function showGracePrompt(dateStr) {
    graceDateStr = dateStr;
    gracePromptModal.classList.remove('hidden');
}

document.getElementById('grace-yes-btn').addEventListener('click', () => {
    // User claims they did it, mark all as true for that day
    state.checkIns[graceDateStr] = {};
    for (let i = 0; i < state.tasks.length; i++) {
        state.checkIns[graceDateStr][i] = true;
    }
    saveState();
    closeModal(gracePromptModal);
    checkDateLogic(); // Re-evaluate
});

document.getElementById('grace-no-btn').addEventListener('click', () => {
    closeModal(gracePromptModal);
    showFailureModal();
});

// Failure Modal
function showFailureModal() {
    failureModal.classList.remove('hidden');
}

document.getElementById('failure-restart-btn').addEventListener('click', () => {
    closeModal(failureModal);
    resetChallenge();
});

// Success Modal
function showSuccessModal() {
    successModal.classList.remove('hidden');
    fireConfetti();
}

document.getElementById('success-stay-btn').addEventListener('click', () => {
    closeModal(successModal);
    showDashboard();
});

document.getElementById('success-new-btn').addEventListener('click', () => {
    closeModal(successModal);
    resetChallenge();
});

// --- Settings Logic ---
document.getElementById('open-settings-btn').addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    document.getElementById('backup-data-textarea').value = generateBackupStr();
    updateRemindersUI();
});

document.getElementById('animation-style-select').addEventListener('change', (e) => {
    state.animationStyle = e.target.value;
    saveState();
    applyTheme();
});

// Reminders UI Logic
const enableRemindersCheckbox = document.getElementById('enable-reminders-checkbox');
const reminderTimeContainer = document.getElementById('reminder-time-container');
const reminderTimeInput = document.getElementById('reminder-time-input');

function updateRemindersUI() {
    enableRemindersCheckbox.checked = state.remindersEnabled;
    reminderTimeInput.value = state.reminderTime;
    if (state.remindersEnabled) {
        reminderTimeContainer.classList.remove('hidden');
    } else {
        reminderTimeContainer.classList.add('hidden');
    }
}

enableRemindersCheckbox.addEventListener('change', async (e) => {
    const isEnabled = e.target.checked;
    
    if (isEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            state.remindersEnabled = true;
            saveState();
            updateRemindersUI();
            scheduleNextNotification();
        } else {
            alert('Notification permission denied. Cannot enable reminders.');
            e.target.checked = false;
            state.remindersEnabled = false;
            saveState();
            updateRemindersUI();
        }
    } else {
        state.remindersEnabled = false;
        saveState();
        updateRemindersUI();
        cancelAllNotifications();
    }
});

reminderTimeInput.addEventListener('change', (e) => {
    state.reminderTime = e.target.value;
    saveState();
    if (state.remindersEnabled) {
        scheduleNextNotification();
    }
});

document.getElementById('reset-challenge-btn').addEventListener('click', () => {
    if (confirm("Are you sure? This will wipe your progress and start over.")) {
        closeModal(settingsModal);
        resetChallenge();
    }
});

function resetChallenge() {
    // Keep tasks and settings, reset startDate and checkIns
    state.startDate = null;
    state.checkIns = {};
    saveState();
    showSetup();
}

// --- Backup / Restore ---
function generateBackupStr() {
    return btoa(JSON.stringify(state));
}

document.getElementById('copy-backup-btn').addEventListener('click', async () => {
    const text = document.getElementById('backup-data-textarea').value;
    try {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    } catch (err) {
        alert('Failed to copy. Please manually select and copy.');
    }
});

document.getElementById('restore-backup-btn').addEventListener('click', () => {
    const input = document.getElementById('backup-data-textarea').value.trim();
    if (!input) return;
    try {
        const parsedState = JSON.parse(atob(input));
        if (parsedState && Array.isArray(parsedState.tasks)) {
            state = parsedState;
            saveState();
            closeModal(settingsModal);
            init();
            alert('Progress restored successfully!');
        } else {
            throw new Error('Invalid backup format');
        }
    } catch (e) {
        alert('Invalid backup code. Please check and try again.');
        console.error(e);
    }
});

// --- Notification Logic ---
async function scheduleNextNotification() {
    if (!state.remindersEnabled || !('serviceWorker' in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // First cancel any existing notifications
        await cancelAllNotifications();

        // Check if today is already completed, if so, don't schedule for today
        const todayStr = getLocalDateString(new Date());
        if (state.startDate && isDayComplete(todayStr)) {
            return; // Tasks done, no need to remind today. Will re-schedule tomorrow when opened.
        }

        const timeParts = state.reminderTime.split(':');
        const triggerDate = new Date();
        triggerDate.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);

        // If the time has already passed today, schedule for tomorrow
        if (triggerDate < new Date()) {
            triggerDate.setDate(triggerDate.getDate() + 1);
        }

        // Experimental Notification Triggers API
        if ('showTrigger' in Notification.prototype) {
            await registration.showNotification("75 Soft Reminder", {
                body: "Don't forget to complete your daily tasks! 💪",
                icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💪</text></svg>",
                tag: "daily-reminder", // Ensures we only have one
                showTrigger: new TimestampTrigger(triggerDate.getTime())
            });
            console.log("Notification scheduled for", triggerDate);
        } else {
            console.warn("Notification Triggers API not supported in this browser.");
        }
    } catch (e) {
        console.error("Failed to schedule notification:", e);
    }
}

async function cancelAllNotifications() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const registration = await navigator.serviceWorker.ready;
        const notifications = await registration.getNotifications({ tag: 'daily-reminder' });
        notifications.forEach(notification => notification.close());
    } catch (e) {
        console.error("Failed to cancel notifications:", e);
    }
}

// --- Confetti Effect (Simple Implementation) ---
function fireConfetti() {
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
}

// Add simple CSS animation for confetti dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes fall {
    to {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);


// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize the app
init();