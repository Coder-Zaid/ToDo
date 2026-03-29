# ToDo — Minimal Quick-Access Command Center

A production-ready, minimal TODO application with a strict black aesthetic, designed for speed and zero distraction. Built as a desktop-first utility with a Spotlight-style overlay interaction.

## ✨ Key Features

- **Strict Black Aesthetic**: Pure black background (`#000000`), minimal typography (Inter), and subtle transitions.
- **Natural Language Parsing**: Add tasks like "Pay bills tomorrow 5pm" or "Review report sunday 10am".
- **Real-time Sync**: Powered by [Convex](https://convex.dev/) for instant, multi-device synchronization.
- **Raycast-style Interaction**:
    - **Global Hotkey** (`Ctrl + Alt + T`) to launch the overlay.
    - **Instant Focus**: Start typing the moment the window appears.
    - **Auto-Cleanup**: Tasks are automatically removed 30 seconds after completion.
- **Tactile Feedback**: Subtle, high-frequency sound beeps for task actions (can be toggled).

## 🛠️ Stack

- **Framework**: Next.js (App Router)
- **Backend**: Convex
- **Styling**: Tailwind CSS v4
- **Natural Language**: `chrono-node`
- **Automation**: AutoHotkey (Windows Desktop Integration)
- **PWA**: Installable for standalone window behavior.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed.
- AutoHotkey (for the Windows shortcut logic).

### 2. Setup
```bash
# Install dependencies
npm install

# Run Convex dev server (Backend)
npx convex dev

# Start Next.js dev server (Frontend)
npm run dev
```

### 3. Desktop Overlay Setup
1. Open `http://localhost:3000` in Chrome/Edge.
2. Click the **Install Icon** in the address bar to install "ToDo" as a standalone app.
3. Locate `quick-todo-overlay.ahk` in the project root.
4. **Double-click the .ahk file** to run it.
5. Use **`Ctrl + Alt + T`** to open the command center from anywhere on your PC.

## ⌨️ Shortcut Guide

- **`Ctrl + Alt + T`**: Open/Focus the overlay.
- **`Enter`**: Add Task.
- **`Esc`**: Close/Dismiss window.
- **`Space/Click`**: Toggle completion.

---
Built with focus by Gemini.
