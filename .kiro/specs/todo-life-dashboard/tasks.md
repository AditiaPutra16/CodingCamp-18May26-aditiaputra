# Implementation Plan: Todo-Life Dashboard

## Overview

This plan implements the Todo-Life Dashboard — a zero-dependency, client-side single-page application consisting of four widgets (Greeting, Focus Timer, Todo List, Quick Links) delivered as three plain files: `index.html`, `css/style.css`, and `js/app.js`. Tasks are ordered to build foundational scaffolding and storage helpers first, then each widget independently, followed by CSS layout, error handling, and finally the full test suite (property-based and unit tests).

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "7"] },
    { "wave": 3, "tasks": ["3", "4", "5", "6"] },
    { "wave": 4, "tasks": ["8", "11", "12", "13"] },
    { "wave": 5, "tasks": ["9", "10"] }
  ]
}
```

**Wave notes:**
- Wave 1 — Project scaffolding (all three files created with skeleton structure).
- Wave 2 — Storage helpers and CSS layout can be built in parallel once scaffolding exists.
- Wave 3 — All four widget implementations can proceed in parallel once storage helpers are ready.
- Wave 4 — Error handling, Light/Dark Mode, Prevent Duplicate Tasks, and Sort Tasks all wire into the widget implementations from Wave 3 and can proceed in parallel.
- Wave 5 — Property-based tests and unit tests run after all implementation is complete.

## Tasks

- [x] 1. Project Scaffolding
  - Create `index.html` with the full page skeleton: `<!DOCTYPE html>`, `<head>` (charset, viewport, title, stylesheet link), and `<body>` containing a `<main class="dashboard-grid">` wrapper with four `<section>` elements: `#greeting`, `#focus-timer`, `#todo-list`, `#quick-links`.
  - Inside `#greeting` add: `<h2>` widget title, `<p id="greeting-text">`, `<p id="clock-time">`, `<p id="clock-date">`.
  - Inside `#focus-timer` add: `<h2>` widget title, `<p id="timer-display">25:00</p>`, `<p id="timer-message" hidden></p>`, and three buttons `#timer-start`, `#timer-stop`, `#timer-reset`.
  - Inside `#todo-list` add: `<h2>` widget title, `<form id="todo-form">` containing `<input id="todo-input" type="text" maxlength="500">`, a submit button, and `<p id="todo-error" hidden></p>`; also add `<ul id="todo-items"></ul>` and `<p id="todo-storage-warning" hidden></p>`.
  - Inside `#quick-links` add: `<h2>` widget title, `<form id="links-form">` containing `<input id="link-label-input" type="text" maxlength="50">`, `<input id="link-url-input" type="url">`, a submit button, and `<p id="links-error" hidden></p>`; also add `<div id="links-container"></div>` and `<p id="links-storage-warning" hidden></p>`.
  - Add a `<script src="js/app.js" defer></script>` in `<head>` (no script tags in body).
  - Create `css/style.css` as an empty file (content added in Task 7).
  - Create `js/app.js` with the full section-comment skeleton: `/* ── CONSTANTS ── */`, `/* ── STORAGE HELPERS ── */`, `/* ── GREETING ── */`, `/* ── FOCUS TIMER ── */`, `/* ── TODO LIST ── */`, `/* ── QUICK LINKS ── */`, `/* ── BOOTSTRAP ── */`, and a `document.addEventListener('DOMContentLoaded', init)` call at the bottom.
  - Define all constants: `STORAGE_KEY_TASKS = 'tld_tasks'`, `STORAGE_KEY_LINKS = 'tld_links'`, `MAX_TASK_LENGTH = 500`, `MAX_LINK_LABEL_LENGTH = 50`, `MAX_LINKS = 20`, `TIMER_DURATION = 1500`.
  - Acceptance check: Opening `index.html` in a browser shows four visible section containers with correct IDs; no console errors on load.

- [ ] 2. Storage Helpers
  - Implement `loadTasks()`: wraps `localStorage.getItem(STORAGE_KEY_TASKS)` in `try/catch`; returns `[]` if the key is absent; calls `showCorruptionNotice('tasks')` and returns `[]` if `JSON.parse` throws.
  - Implement `saveTasks(tasks)`: wraps `localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks))` in `try/catch`; returns `true` on success, `false` on any error (quota exceeded, storage unavailable).
  - Implement `loadLinks()`: identical pattern using `STORAGE_KEY_LINKS`; calls `showCorruptionNotice('links')` on parse failure.
  - Implement `saveLinks(links)`: identical pattern using `STORAGE_KEY_LINKS`; returns `true`/`false`.
  - Implement `showCorruptionNotice(type)`: accepts `'tasks'` or `'links'`; makes the corresponding `#todo-storage-warning` or `#links-storage-warning` element visible with an appropriate message (e.g., "Saved data was corrupted and has been reset.").
  - All four storage functions must use `const` / `let` (no `var`) and follow the `try/catch` pattern from the design doc.
  - Acceptance check: Manually calling `saveTasks([{description:'test',completed:false}])` in the browser console writes to `localStorage`; `loadTasks()` returns the array; `loadLinks()` returns `[]` when key is absent.

- [x] 3. Greeting Widget
  - Implement `getGreeting(hour)`: pure function; returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for 0–4 and 21–23.
  - Implement `formatTime(date)`: returns a 5-character `"HH:MM"` string using zero-padded 24-hour hours and minutes extracted from the `Date` object.
  - Implement `formatDate(date)`: returns a string in the format `"Weekday, DD Month YYYY"` using the English weekday name array, zero-padded day, English month name array, and full 4-digit year.
  - Implement `tickClock()`: reads `new Date()`, sets `#greeting-text` to `getGreeting(hour)`, sets `#clock-time` to `formatTime(date)`, sets `#clock-date` to `formatDate(date)`.
  - Implement `initGreeting()`: calls `tickClock()` once immediately, then schedules `setInterval(tickClock, 60000)`.
  - Acceptance check: On page load the greeting, time, and date are all visible and correct; waiting 60 seconds (or manually calling `tickClock()`) updates the display.

- [x] 4. Focus Timer Widget
  - Declare module-level variables `let timerSeconds = TIMER_DURATION` and `let timerInterval = null`.
  - Implement `formatCountdown(seconds)`: returns a 5-character `"MM:SS"` string; `MM = Math.floor(seconds / 60)` zero-padded to 2 digits, `SS = seconds % 60` zero-padded to 2 digits.
  - Implement `startTimer()`: guards with `if (timerInterval !== null || timerSeconds <= 0) return`; creates a `setInterval` that decrements `timerSeconds` each second, updates `#timer-display`, and when `timerSeconds` reaches 0 clears the interval, sets `timerInterval = null`, shows `#timer-message` with text `"Session complete!"`.
  - Implement `stopTimer()`: calls `clearInterval(timerInterval)` and sets `timerInterval = null`; does not change `timerSeconds`.
  - Implement `resetTimer()`: calls `clearInterval(timerInterval)`, sets `timerInterval = null`, sets `timerSeconds = TIMER_DURATION`, updates `#timer-display` to `"25:00"`, hides `#timer-message`.
  - Implement `initTimer()`: sets `#timer-display` to `formatCountdown(timerSeconds)`, adds `click` listeners on `#timer-start` → `startTimer`, `#timer-stop` → `stopTimer`, `#timer-reset` → `resetTimer`.
  - Acceptance check: Start counts down; Stop pauses; Reset restores 25:00; reaching 0:00 shows "Session complete!"; pressing Start when already running does not create a second interval.

- [x] 5. Todo List Widget
  - Implement `validateTaskDescription(text)`: pure function; returns `{ valid: false, message: 'Task cannot be empty.' }` if `text.trim()` is empty; returns `{ valid: false, message: 'Task must be 500 characters or fewer.' }` if `text.length > MAX_TASK_LENGTH`; otherwise returns `{ valid: true, message: '' }`.
  - Implement `renderTasks(tasks)`: clears `#todo-items`; for each task creates an `<li class="todo-item" data-id="i">` containing a checkbox (checked if `completed`), a `<span class="todo-desc">` with strikethrough style if completed, Edit and Delete buttons, and a hidden `<p class="todo-item-error">`.
  - Implement `addTask(description)`: validates with `validateTaskDescription`; on failure shows `#todo-error` and returns; on success creates `{ description, completed: false }`, pushes to the tasks array, calls `saveTasks`; if `saveTasks` returns `false` shows an inline storage error and reverts; otherwise clears `#todo-input`, hides `#todo-error`, calls `renderTasks`.
  - Implement `editTask(index)`: re-renders the specific `<li>` in edit mode — replaces the `<span>` with `<input type="text" class="todo-edit-input" maxlength="500">` pre-populated with the task's description, and adds Save and Cancel buttons; hides the Edit button.
  - Implement `saveEditTask(index, newText)`: validates with `validateTaskDescription`; on failure shows `.todo-item-error` for that item; on success updates `tasks[index].description`, calls `saveTasks`; if `saveTasks` returns `false` shows inline storage error; otherwise calls `renderTasks`.
  - Implement `cancelEditTask(index)`: calls `renderTasks` without modifying the tasks array.
  - Implement `toggleTask(index)`: flips `tasks[index].completed`, calls `saveTasks`; if `saveTasks` returns `false` reverts the flip and shows inline storage error; otherwise calls `renderTasks`.
  - Implement `deleteTask(index)`: removes `tasks[index]` with `splice`, calls `saveTasks`; if `saveTasks` returns `false` re-inserts the item and shows inline storage error; otherwise calls `renderTasks`.
  - Implement `initTodoList()`: loads tasks via `loadTasks()`, calls `renderTasks`, wires `#todo-form` submit listener (calls `addTask` with `#todo-input` value), wires event delegation on `#todo-items` using `event.target.closest('[data-id]')` to dispatch edit/save/cancel/toggle/delete actions.
  - Acceptance check: Add, edit, complete, and delete tasks; refresh the page and verify tasks persist; submit empty input and verify inline error appears.

- [x] 6. Quick Links Widget
  - Implement `validateLinkLabel(text)`: pure function; returns `{ valid: false, message: 'Label cannot be empty.' }` if empty; `{ valid: false, message: 'Label must be 50 characters or fewer.' }` if `text.length > MAX_LINK_LABEL_LENGTH`; otherwise `{ valid: true, message: '' }`.
  - Implement `validateLinkUrl(url)`: pure function; returns `{ valid: false, message: 'URL cannot be empty.' }` if empty; returns `{ valid: false, message: 'URL must start with http:// or https://.' }` if it does not start with `http://` or `https://`; extracts the domain portion after the prefix and returns `{ valid: false, message: 'URL must include a domain.' }` if the domain is empty; otherwise returns `{ valid: true, message: '' }`.
  - Implement `isDuplicateUrl(url, links)`: pure function; returns `true` if any element in `links` has `link.url === url`, `false` otherwise.
  - Implement `renderLinks(links)`: clears `#links-container`; for each link creates a `<div class="quick-link-item">` containing a `<button class="quick-link-btn" data-url="...">` with the label text and a `<button class="quick-link-delete-btn" data-index="i">×</button>`.
  - Implement `addLink(label, url)`: validates label with `validateLinkLabel` and url with `validateLinkUrl`; on any failure shows `#links-error` and returns; checks `isDuplicateUrl` and shows duplicate error if true; checks `links.length >= MAX_LINKS` and shows limit error if true; creates `{ label, url }`, pushes to links array, calls `saveLinks`; if `saveLinks` returns `false` shows inline storage error and reverts; otherwise clears inputs, hides `#links-error`, calls `renderLinks`.
  - Implement `deleteLink(index)`: removes `links[index]` with `splice`, calls `saveLinks`; if `saveLinks` returns `false` re-inserts and shows inline storage error; otherwise calls `renderLinks`.
  - Implement `initQuickLinks()`: loads links via `loadLinks()`, calls `renderLinks`, wires `#links-form` submit listener (calls `addLink` with label and url input values), wires event delegation on `#links-container` — `quick-link-btn` click calls `window.open(url, '_blank')`, `quick-link-delete-btn` click calls `deleteLink(index)`.
  - Acceptance check: Add a link, click it to open in a new tab, delete it; verify persistence across refresh; test duplicate URL rejection and 20-link limit.

- [x] 7. CSS Layout and Responsive Design
  - Add a CSS reset/normalise block: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`.
  - Style `body`: `font-size: 16px`, a readable font stack (system-ui or similar), a neutral background colour, and `min-height: 100vh`.
  - Style `.dashboard-grid`: `display: grid`, `grid-template-columns: repeat(2, 1fr)`, `gap: 24px`, `padding: 24px`, `max-width: 1200px`, `margin: 0 auto`.
  - Add the responsive breakpoint: `@media (max-width: 767px) { .dashboard-grid { grid-template-columns: 1fr; } }`.
  - Style each `section` as a card: `background`, `border-radius`, `padding: 24px` (≥16px), `box-shadow` or `border`, ensuring at least 16px visual separation between adjacent widgets.
  - Style `h2` / widget titles: `font-size: 20px` (≥18px), `margin-bottom: 12px`.
  - Style `#clock-time`: large, prominent font size (e.g., 48px) for readability.
  - Style `#timer-display`: large font size (e.g., 40px); `font-variant-numeric: tabular-nums` to prevent layout shift.
  - Style `#timer-message`: distinct colour (e.g., green or accent colour) to make session-end visible.
  - Style `#todo-form` and `#links-form`: flex row layout with gap; inputs take available space; buttons are clearly styled.
  - Style `.todo-item`: flex row, aligned items, gap between elements; `.todo-desc.completed` applies `text-decoration: line-through` and reduced opacity.
  - Style `.quick-link-item`: inline-flex or flex-wrap layout; `.quick-link-btn` styled as a pill/badge button.
  - Style all error/warning `<p>` elements: `color: red` (or equivalent), `font-size: 0.875rem`, visible when not `hidden`.
  - Style buttons consistently: cursor pointer, padding, border-radius, hover state.
  - Acceptance check: At ≥768px viewport the four widgets appear in a 2-column grid; below 768px they stack in a single column; all font sizes meet minimums; widget cards have visible separation.

- [ ] 8. Error Handling
  - In `initTodoList()`: detect `localStorage` unavailability by attempting a test write in a `try/catch` at startup; if unavailable, show `#todo-storage-warning` with message "localStorage is unavailable — tasks will not be saved this session." and set a module-level `storageAvailable` flag to `false`; skip all `saveTasks` calls when the flag is `false`.
  - In `initQuickLinks()`: same detection pattern; if unavailable, show a `confirm()` dialog — "localStorage is unavailable. Quick links will not be saved this session. Continue?" — if the user confirms, set a `linksStorageAvailable` flag to `false` and proceed in session-only mode; if the user cancels, show `#links-storage-warning` with an appropriate message.
  - In `addTask`, `saveEditTask`, `toggleTask`, `deleteTask`: when `saveTasks()` returns `false` (quota exceeded), block the mutation (revert any array change already made), show an inline error message in `#todo-error` or the relevant `.todo-item-error` element: "Could not save — storage quota exceeded."
  - In `addLink`, `deleteLink`: same pattern — when `saveLinks()` returns `false`, revert and show `#links-error`: "Could not save — storage quota exceeded."
  - Ensure `loadTasks()` and `loadLinks()` already call `showCorruptionNotice` on malformed JSON (implemented in Task 2); verify `showCorruptionNotice` makes the warning element visible with a clear message.
  - Acceptance check: Simulate `localStorage` unavailability by overriding `localStorage.setItem` to throw; verify warning messages appear; simulate malformed JSON by manually setting `localStorage.tld_tasks = 'not-json'` and refreshing; verify corruption notice appears and the list starts empty.

- [x] 11. Light/Dark Mode
  - Add a `<button id="theme-toggle" aria-label="Toggle theme">` to `index.html` in a visible, accessible position (e.g., top-right of the page header or inside a `<header>` element above `.dashboard-grid`).
  - Add `STORAGE_KEY_THEME = 'tld_theme'` to the constants block in `app.js`.
  - Implement `loadTheme()`: reads `localStorage.getItem(STORAGE_KEY_THEME)` in a `try/catch`; if the stored value is `"light"` or `"dark"` return it; if the value is anything else (missing, null, or invalid) fall back to `window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'`.
  - Implement `applyTheme(theme)`: sets `document.body.setAttribute('data-theme', theme)` and updates the `#theme-toggle` button label/icon to reflect the current state (e.g., "☀️" for dark mode, "🌙" for light mode).
  - Implement `saveTheme(theme)`: wraps `localStorage.setItem(STORAGE_KEY_THEME, theme)` in `try/catch`; silently ignores errors (session-only fallback).
  - Implement `toggleTheme()`: reads the current `data-theme` from `document.body`, computes the opposite value, calls `applyTheme(newTheme)` then `saveTheme(newTheme)`.
  - Implement `initTheme()`: calls `applyTheme(loadTheme())` to apply the correct theme before any content renders; adds a `click` listener on `#theme-toggle` → `toggleTheme`.
  - In `css/style.css`: define CSS custom properties for both themes using `[data-theme="light"]` and `[data-theme="dark"]` attribute selectors on `body`; at minimum define `--bg-color`, `--surface-color`, `--text-color`, `--border-color`, `--accent-color`; apply these variables to `body`, `.dashboard-grid section`, inputs, buttons, and all text elements so the entire UI responds to the theme switch.
  - Call `initTheme()` as the first call inside the `init()` function (before `initGreeting`, `initTimer`, etc.) so the theme is applied before other widgets render.
  - Acceptance check: Toggle switches between light and dark; refresh the page and verify the saved theme is restored; set `localStorage.tld_theme = 'invalid'` and refresh — verify it falls back to system preference; verify `data-theme` attribute on `<body>` changes correctly.

- [x] 12. Prevent Duplicate Tasks
  - Implement `isDuplicateTask(description, tasks, excludeIndex = -1)`: pure function; normalises `description` with `.trim().toLowerCase()`; iterates `tasks` and returns `true` if any task at an index other than `excludeIndex` has a normalised description equal to the normalised input; returns `false` otherwise.
  - Update `validateTaskDescription(text)` (or add a separate duplicate-check step in `addTask` and `saveEditTask`) to call `isDuplicateTask` after the length/empty checks pass; if a duplicate is found, return `{ valid: false, message: 'A task with this description already exists.' }`.
  - Update `addTask(description)`: after existing length/empty validation, call `isDuplicateTask(description, tasks)` with `excludeIndex = -1`; if duplicate, show `#todo-error` with the duplicate message and preserve the input field value (do not clear it); return without adding.
  - Update `saveEditTask(index, newText)`: after existing length/empty validation, call `isDuplicateTask(newText, tasks, index)` (passing the current task index as `excludeIndex` so a task is not flagged as a duplicate of itself); if duplicate, show `.todo-item-error` for that item and preserve the edit field value; return without saving.
  - Add an `input` event listener on `#todo-input` that hides `#todo-error` when the user modifies the field (to dismiss the duplicate message per Requirement 8.5).
  - Add an `input` event listener on each `.todo-edit-input` (wired in `editTask`) that hides the corresponding `.todo-item-error` when the user modifies the edit field.
  - Acceptance check: Add task "Buy milk"; try to add "buy milk" (lowercase) — verify rejection with inline message and input preserved; try to add "  Buy Milk  " (padded) — verify rejection; edit "Buy milk" to "Buy milk" (same value) — verify no duplicate error; edit to "buy eggs" — verify save succeeds.

- [x] 13. Sort Tasks
  - Add `STORAGE_KEY_SORT = 'tld_sort'` and `SORT_OPTIONS = ['insertion', 'az', 'za', 'incomplete-first', 'complete-first']` to the constants block in `app.js`.
  - Add a `<label for="todo-sort">Sort:</label><select id="todo-sort">` element inside `#todo-list` in `index.html`, with five `<option>` elements: value `"insertion"` (Default), `"az"` (A → Z), `"za"` (Z → A), `"incomplete-first"` (Incomplete First), `"complete-first"` (Complete First).
  - Declare a module-level `let currentSort = 'insertion'` variable.
  - Implement `loadSort()`: reads `localStorage.getItem(STORAGE_KEY_SORT)` in a `try/catch`; returns the stored value if it is one of `SORT_OPTIONS`; otherwise returns `'insertion'` (handles missing, null, and invalid/corrupted values — per Requirement 9.9, also calls `saveSort('insertion')` to overwrite the bad value).
  - Implement `saveSort(order)`: wraps `localStorage.setItem(STORAGE_KEY_SORT, order)` in `try/catch`; silently ignores errors.
  - Implement `getSortedTasks(tasks, order)`: pure function; creates a shallow copy of `tasks` with `[...tasks]` (never mutates the original); sorts the copy according to `order`: `'az'` → `localeCompare` ascending, `'za'` → `localeCompare` descending, `'incomplete-first'` → incomplete (`completed === false`) before complete, `'complete-first'` → complete before incomplete, `'insertion'` → no sort (original order preserved); returns the sorted copy.
  - Update `renderTasks(tasks)`: replace the direct iteration over `tasks` with `getSortedTasks(tasks, currentSort)` so the rendered order always reflects the active sort.
  - Update `initTodoList()`: call `currentSort = loadSort()` before `renderTasks`; set `document.getElementById('todo-sort').value = currentSort` to sync the control; add a `change` event listener on `#todo-sort` that sets `currentSort = event.target.value`, calls `saveSort(currentSort)`, and calls `renderTasks(tasks)`.
  - Acceptance check: Add tasks "Banana", "Apple", "Cherry"; select A→Z — verify order is Apple, Banana, Cherry; select Z→A — verify reverse; mark "Apple" complete, select Incomplete First — verify Apple is last; refresh and verify sort order and control selection are restored; set `localStorage.tld_sort = 'bad'` and refresh — verify insertion order is used and `tld_sort` is overwritten with `"insertion"`.

- [ ] 9. Property-Based Tests (fast-check)
  - Create `tests/pbt.html`: an HTML test runner that loads `tests/fast-check.min.js` via `<script>` tag, then loads `js/app.js` via `<script>` tag, then loads `tests/pbt.js` via `<script>` tag; include the same four widget `<section>` elements as `index.html` so DOM queries resolve correctly.
  - Save the fast-check UMD bundle locally as `tests/fast-check.min.js` (sourced from `https://cdn.jsdelivr.net/npm/fast-check/lib/bundle/fast-check.min.js`) so tests work offline.
  - Create `tests/pbt.js` with a minimal test harness (`let passed = 0, failed = 0; function test(name, fn) { ... }`) and implement all 14 property tests below. Each test must use `{ numRuns: 100 }` and include a comment `// Property N: <name>` referencing the design doc.
  - 9.1 Write property test for Property 1 — formatTime format (`Validates: Requirements 1.2`): use `fc.date()` and verify the result is exactly 5 characters matching `HH:MM`, HH in 00–23, MM in 00–59.
  - 9.2 Write property test for Property 2 — formatDate format (`Validates: Requirements 1.3`): use `fc.date()` and verify the result matches `"Weekday, DD Month YYYY"` with valid English weekday, day 01–31, valid English month name, 4-digit year.
  - 9.3 Write property test for Property 3 — getGreeting all hours (`Validates: Requirements 1.4–1.7`): use `fc.integer({ min: 0, max: 23 })` and assert the correct greeting string for each hour range; verify every integer 0–23 maps to exactly one greeting.
  - 9.4 Write property test for Property 4 — formatCountdown format (`Validates: Requirements 2.2`): use `fc.integer({ min: 0, max: 1500 })` and verify exactly 5 chars, MM in 00–25, SS in 00–59.
  - 9.5 Write property test for Property 5 — reset invariant (`Validates: Requirements 2.4`): use `fc.integer({ min: 0, max: 1500 })` to set `timerSeconds` to arbitrary values, call `resetTimer()`, assert `timerSeconds === 1500` and `#timer-display` shows `"25:00"`.
  - 9.6 Write property test for Property 6 — task addition correctness (`Validates: Requirements 3.1`): define `taskArb`; use `fc.array(taskArb)` and `fc.string({ minLength: 1, maxLength: 500 })` to assert after `addTask(desc)` the tasks array length is `n + 1` and the last task has the correct description and `completed === false`.
  - 9.7 Write property test for Property 7 — task description validation (`Validates: Requirements 3.2, 3.5`): use `fc.string()` (full range); assert empty/whitespace-only strings return `valid: false`; strings longer than 500 chars return `valid: false`; strings of 1–500 non-whitespace chars return `valid: true`.
  - 9.8 Write property test for Property 8 — toggle round-trip (`Validates: Requirements 3.6`): use `fc.boolean()` as initial `completed` state; assert toggling twice returns to original value; toggling once produces the boolean complement.
  - 9.9 Write property test for Property 9 — deletion reduces length by one (`Validates: Requirements 3.7, 4.7`): use `fc.array(taskArb, { minLength: 1 })` and a bounded `fc.integer` index; assert after deletion the array length is `n - 1` and the deleted item is no longer at the original index.
  - 9.10 Write property test for Property 10 — serialization round-trip (`Validates: Requirements 3.8, 4.8, 5.3, 5.4`): use `fc.array(taskArb)` and `fc.array(linkArb)`; assert `JSON.parse(JSON.stringify(arr))` produces equal-length arrays with identical field values.
  - 9.11 Write property test for Property 11 — link addition correctness (`Validates: Requirements 4.1`): define `linkArb`; use `fc.array(linkArb, { maxLength: 19 })` and valid label/url arbitraries; assert after `addLink(label, url)` the links array length is `n + 1` and the new link has correct `label` and `url`.
  - 9.12 Write property test for Property 12 — link label validation (`Validates: Requirements 4.2`): use `fc.string()`; assert empty strings return `valid: false`; strings longer than 50 chars return `valid: false`; strings of 1–50 chars return `valid: true`.
  - 9.13 Write property test for Property 13 — link URL validation (`Validates: Requirements 4.3`): use `fc.string()` for invalid cases and `fc.webUrl()` for valid cases; assert strings not starting with `http://` or `https://` return `valid: false`; `http://` or `https://` with empty domain return `valid: false`; well-formed URLs return `valid: true`.
  - 9.14 Write property test for Property 14 — duplicate URL detection (`Validates: Requirements 4.4`): use `fc.array(linkArb)` and `fc.string()`; assert `isDuplicateUrl(url, links)` returns `true` when `url` is present and `false` when absent.
  - Display pass/fail counts in `pbt.html` and log each result to the console.
  - Acceptance check: Open `tests/pbt.html` in a browser; all 14 property tests pass with 0 failures.

- [ ] 10. Unit Tests
  - Create `tests/unit.html`: an HTML test runner that loads `js/app.js` and `tests/unit.js` via `<script>` tags; includes the same four widget `<section>` elements as `index.html` so DOM queries in `app.js` resolve correctly.
  - Create `tests/unit.js` with a minimal `test(name, fn)` harness using `console.assert` and a pass/fail counter.
  - 10.1 Test greeting widget initial render (`Validates: Requirements 1.1`): call `initGreeting()` and assert `#greeting-text`, `#clock-time`, and `#clock-date` are all non-empty strings.
  - 10.2 Test timer initial state (`Validates: Requirements 2.1`): assert `#timer-display` shows `"25:00"` after `initTimer()`.
  - 10.3 Test timer stop retains time (`Validates: Requirements 2.3`): call `startTimer()`, manually decrement `timerSeconds`, call `stopTimer()`, assert `timerSeconds` is unchanged after stop.
  - 10.4 Test timer session-end message (`Validates: Requirements 2.5`): set `timerSeconds = 1`, call `startTimer()`, wait for the interval tick, assert `#timer-message` is visible and contains `"Session complete!"`.
  - 10.5 Test edit mode pre-population (`Validates: Requirements 3.3`): add a task, call `editTask(0)`, assert the `.todo-edit-input` value equals the task's description.
  - 10.6 Test cancel edit discards changes (`Validates: Requirements 3.4`): add a task, call `editTask(0)`, modify the edit input value, call `cancelEditTask(0)`, assert the task description is unchanged.
  - 10.7 Test completed task strikethrough (`Validates: Requirements 3.6`): add a task, call `toggleTask(0)`, assert the rendered `<span class="todo-desc">` has `text-decoration: line-through` or the `completed` class applied.
  - 10.8 Test link opens in new tab (`Validates: Requirements 4.6`): stub `window.open`; add a link, simulate a click on the `.quick-link-btn`; assert `window.open` was called with the correct URL and `'_blank'`.
  - 10.9 Test localStorage unavailability warning for tasks (`Validates: Requirements 3.10`): override `localStorage.getItem` to throw; call `initTodoList()`; assert `#todo-storage-warning` is visible.
  - 10.10 Test localStorage unavailability warning for links (`Validates: Requirements 4.10, 4.11`): override `localStorage.getItem` to throw; stub `window.confirm` to return `true`; call `initQuickLinks()`; assert session-only mode is active.
  - 10.11 Test malformed JSON recovery for tasks (`Validates: Requirements 5.5`): set `localStorage.tld_tasks = 'not-json'`; call `loadTasks()`; assert it returns `[]` and `#todo-storage-warning` is visible.
  - 10.12 Test malformed JSON recovery for links (`Validates: Requirements 5.6`): set `localStorage.tld_links = '{bad'`; call `loadLinks()`; assert it returns `[]` and `#links-storage-warning` is visible.
  - 10.13 Test storage key names (`Validates: Requirements 5.1, 5.2`): assert `STORAGE_KEY_TASKS === 'tld_tasks'` and `STORAGE_KEY_LINKS === 'tld_links'`.
  - Display pass/fail counts in `unit.html`.
  - Acceptance check: Open `tests/unit.html` in a browser; all unit tests pass with 0 failures.

## Notes

- All JavaScript must be written in `js/app.js` only — no additional JS files, no `<script>` tags in the HTML body.
- All styles must be written in `css/style.css` only — no inline styles, no additional CSS files.
- Use `const` by default; `let` only when reassignment is needed; never `var`.
- Every `localStorage` access must be wrapped in `try/catch`.
- CSS class names use kebab-case; JavaScript identifiers use camelCase.
- The fast-check UMD bundle must be saved locally in `tests/` so property tests work without a network connection.
- Tasks 9 and 10 depend on the pure helper functions (`getGreeting`, `formatTime`, `formatDate`, `formatCountdown`, `validateTaskDescription`, `validateLinkLabel`, `validateLinkUrl`, `isDuplicateUrl`, `isDuplicateTask`, `getSortedTasks`) being exposed on the global scope (not wrapped in a closure that hides them) — structure `app.js` accordingly, or expose them via a `window.appHelpers` object for testability.
- localStorage keys used by the application: `tld_tasks`, `tld_links`, `tld_theme`, `tld_sort`.
