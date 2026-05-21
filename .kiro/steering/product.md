# Product Overview

**Todo-Life Dashboard** is a personal productivity hub built as a client-side, single-page web application. It is a mini project for RevoU Bootcamp (18–22 May 2026).

## Core Widgets

- **Greeting Widget** — displays live time (HH:MM, 24-hour), current date, and a time-of-day greeting (Good Morning / Afternoon / Evening / Night).
- **Focus Timer** — 25-minute Pomodoro-style countdown with Start, Stop, and Reset controls.
- **To-Do List** — persistent task manager with add, edit, complete (strikethrough), and delete operations.
- **Quick Links** — up to 20 user-defined shortcut buttons that open URLs in a new tab.

## Key Constraints

- No backend, no build tools, no external dependencies — pure HTML + CSS + Vanilla JS.
- All data persists via the browser's `localStorage` API (`tld_tasks` and `tld_links` keys).
- Must work as a standalone web page or browser extension in Chrome, Firefox, Edge, and Safari (current stable).
