# 75 Soft - Application Specification

## 1. Overview
The 75 Soft app is a web application designed to help users track their progress through the "75 Soft" challenge. The user must complete a locked-in set of daily tasks for 75 consecutive days. Missing a task on any given day breaks the streak, requiring the user to restart from Day 1.

## 2. Technical Architecture & Constraints
- **Tech Stack**: Pure Vanilla HTML, CSS, and JavaScript. No build tools (like Webpack or Vite) or heavy frameworks.
- **Hosting**: GitHub Pages.
- **Data Storage**: Client-side `LocalStorage` only. No backend server or database.
- **PWA (Progressive Web App)**: Must be installable on Android devices. Uses the native browser prompt for installation rather than a custom in-app button. It includes a Service Worker for offline capabilities.

## 3. Core Mechanics & State Management
- **The "Day" Definition**: Rollover happens strictly at **Midnight Local Time**.
- **Challenge Start**: The challenge begins immediately the moment the user first defines and saves their tasks. "Today" counts as Day 1.
- **Task Locking**: Once the 75-day challenge has started, tasks are strictly locked. Users cannot add, edit, or delete tasks. Any modification to the task list requires a full reset to Day 1.
- **Task Toggling & Progress**: Users can track tasks either as simple boolean checkmarks or with numeric progress (e.g., 1/4 bottles). For numeric tasks, users can increment/decrement progress via +/- buttons up to a target goal. Once the goal is reached, the task auto-completes. Progress cannot exceed the target. If they need to uncheck a task (due to an accidental tap), they must pass a confirmation dialog to prevent accidental unchecking.
- **The Grace Prompt**: Because the app relies on LocalStorage, it cannot automatically reset the streak at exactly midnight. If the user opens the app on a new day and yesterday's tasks were left unchecked, they will receive a "Grace Prompt" asking if they actually completed them but forgot to check in.
- **Local Notifications (Experimental)**: Users can enable a daily reminder notification at a custom time. It uses the experimental Notification Triggers API (`showTrigger`), which operates completely offline via the Service Worker. Due to its experimental nature, it is primarily supported on Android/Chrome.

## 4. UI/UX Design & Layout
- **Visual Theme**: A modern **Glassmorphism Dark Mode**. It uses a deep slate radial gradient background, subtle transparencies, frosted borders, inner shadows, and sleek text gradients (like the emerald "Day X" counter).
- **Layout Structure**: 
  - **Setup View**: Initial screen for defining tasks. Once saved, this locks into the main dashboard.
  - **Dashboard View**: The main interface showing today's tasks and the overall progress.
  - **Settings Modal**: Accessible via a gear icon on the dashboard, allowing users to backup data, configure animations, set daily reminders, or manually reset the challenge. The modal uses a backdrop blur to focus the user's attention.
- **Progress Visualization**: A central, prominent **Circular Progress Ring** showing the current day out of 75. It features a soft neon glow when active.
- **Animations Settings**: A dedicated toggle in settings to switch between different animation styles for interactions (e.g., Smooth/Satisfying, Snappy/Instant, Playful/Haptic). Hover and active states include satisfying "lift" and "press down" micro-interactions.

## 5. Event Scenarios
- **Failure**: If a user genuinely fails a day (either confirmed via Grace Prompt or explicit reset), they are shown a **Motivational / Gentle** UI encouraging them not to give up, with a soft button to restart Day 1.
- **Success (Day 76)**: Upon checking off the final task on Day 75, the user is presented with a "Celebrate & Hold" state, complete with confetti. The app stays locked at 75/75 until the user manually chooses to start a new journey.

## 6. Data Backup & Portability
- **Base64 URL Encoding**: Since there is no backend, users can backup or migrate their progress using a generated string containing a Base64-encoded payload.
- **Payload Contents**: "Full State Backup" – The encoded string includes the locked task list, the original start timestamp, animation preferences, reminder settings, and an array of all daily check-ins to perfectly preserve the history and streak state upon import.
