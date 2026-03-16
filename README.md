# 75 Soft

A lightweight, purely client-side web application designed to help users track their progress through the "75 Soft" challenge. The app requires users to complete a locked-in set of daily tasks for 75 consecutive days. Missing a task on any given day breaks the streak, requiring the user to restart from Day 1.

## Features

- **No Backend & Fully Offline**: Built with pure vanilla HTML, CSS, and JavaScript. All data is stored in your browser's `LocalStorage`.
- **Progressive Web App (PWA)**: Installable directly to your device with offline support via Service Workers.
- **Task Locking**: Once the 75-day challenge starts, tasks are strictly locked to maintain the integrity of the challenge.
- **Grace Prompt**: Built-in rollover protection at midnight. If you forget to check off your completed tasks before midnight, a grace prompt will allow you to catch up.
- **Data Portability**: Easily backup or migrate your progress across devices using a Base64 encoded payload.
- **Modern UI**: A visually pleasing glassmorphism dark mode with sleek animations and a central circular progress ring.
- **Daily Reminders (Experimental)**: Optional local notifications (primarily supported on Android/Chrome) to remind you to complete your tasks.

## Usage

1. Open the application.
2. **Define Tasks**: Enter the daily tasks you wish to commit to (e.g., "Drink 1 gallon of water", "Read 10 pages").
3. **Start Challenge**: Once you hit start, your tasks are locked in, and the 75-day timer begins.
4. **Daily Check-ins**: Check off each task as you complete them daily.
5. **Settings**: Use the gear icon to adjust animations, setup daily reminders, or backup/restore your progress data.

## Development

This project uses no build tools, frameworks, or bundlers. To run it locally:

1. Clone the repository.
2. Serve the directory using any static file server, for example:
   ```bash
   npx serve .
   # or
   python3 -m http.server
   ```
3. Open your browser to the local server address.

## Technologies Used

- HTML5
- CSS3 (Custom properties, animations, glassmorphism UI)
- Vanilla JavaScript (ES6+)
- Service Workers & Manifest (for PWA capabilities)
- Web Notification API
