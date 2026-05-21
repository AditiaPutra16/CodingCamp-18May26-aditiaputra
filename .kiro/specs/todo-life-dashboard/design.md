# Design Document — Todo-Life Dashboard

## Overview

The Todo-Life Dashboard is a zero-dependency, client-side single-page application (SPA) delivered as three plain files: `index.html`, `css/style.css`, and `js/app.js`. There is no build step, no module bundler, and no external runtime. The page is opened directly in a browser (or served by any static file server).

The application is composed of four independent widgets that share a single persistent store (the browser's `localStorage`). Each widget owns its own slice of the DOM, its own data, and its own event handlers, but all live inside the single `app.js` file organised as a set of clearly-named, self-contained function groups (module-like sections separated by comments).

**Key design goals:**
- Simplicity — every behaviour is traceable to a single function in `app.js`.
- Resilience — every `localStorage` access is wrapped in `try/catch`; malformed data is discarded gracefully.
- Responsiveness — CSS Grid handles layout; a single media-query breakpoint at 768 px switches between 2-column and 1-column layouts.
- Correctness — data validation is centralised in pure helper functions that are easy to unit-test and property-test.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     index.html                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  #greeting   │  │ #focus-timer │                     │
│  └──────────────┘  └──────────────┘                     │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │  #todo-list  │  │ #quick-links │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
          │ DOM queries / event listeners
          ▼
┌─────────────────────────────────────────────────────────┐
│                      js/app.js                          │
│                                                         │
│  ── Storage helpers ──────────────────────────────────  │
│     loadTasks()  saveTasks()                            │
│     loadLinks()  saveLinks()                            │
│                                                         │
│  ── Greeting module ──────────────────────────────────  │
│     getGreeting(hour)  formatTime(date)                 │
│     formatDate(date)   initGreeting()  tickClock()      │
│                                                         │
│  ── Focus Timer module ───────────────────────────────  │
│     formatCountdown(seconds)  initTimer()               │
│     startTimer()  stopTimer()  resetTimer()             │
│                                                         │
│  ── Todo List module ─────────────────────────────────  │
│     validateTaskDescription(text)                       │
│     renderTasks()  addTask()  editTask()                │
│     saveEditTask()  cancelEditTask()                    │
│     toggleTask()  deleteTask()                          │
│                                                         │
│  ── Quick Links module ───────────────────────────────  │
│     validateLinkLabel(text)  validateLinkUrl(url)       │
│     isDuplicateUrl(url, links)                          │
│     renderLinks()  addLink()  deleteLink()              │
│                                                         │
│  ── Bootstrap ────────────────────────────────────────  │
│     init()   (called on DOMContentLoaded)               │
└─────────────────────────────────────────────────────────┘
          │ read / write
          ▼
┌─────────────────────────────────────────────────────────┐
│                   localStorage                          │
│   tld_tasks  →  JSON array of Task objects              │
│   tld_links  →  JSON array of Link objects              │
└─────────────────────────────────────────────────────────┘
```

### Runtime flow

1. Browser parses `index.html` and loads `css/style.css` and `js/app.js`.
2. `app.js` registers a `DOMContentLoaded` listener that calls `init()`.
3. `init()` calls each widget's initialiser in order: `initGreeting()`, `initTimer()`, `initTodoList()`, `initQuickLinks()`.
4. `initGreeting()` renders immediately and schedules a `setInterval` tick every 60 seconds.
5. `initTimer()` wires up button event listeners; the countdown interval is created only when Start is pressed.
6. `initTodoList()` and `initQuickLinks()` load data from `localStorage`, render the current state, and wire up form event listeners.

---

## Components and Interfaces

### 1. Greeting Widget

**Responsibility:** Display live time, date, and a time-of-day greeting. Update every minute.

**DOM elements (in `index.html`):**
```html
<section id="greeting">
  <p id="greeting-text"></p>   <!-- "Good Morning" etc. -->
  <p id="clock-time"></p>      <!-- "14:07" -->
  <p id="clock-date"></p>      <!-- "Monday, 26 May 2025" -->
</section>
```

**Key functions:**
| Function | Signature | Description |
|---|---|---|
| `getGreeting` | `(hour: number) → string` | Pure function; maps 0–23 hour to greeting string |
| `formatTime` | `(date: Date) → string` | Returns `"HH:MM"` zero-padded 24-hour string |
| `formatDate` | `(date: Date) → string` | Returns `"Weekday, DD Month YYYY"` string |
| `tickClock` | `() → void` | Reads `new Date()`, updates all three DOM elements |
| `initGreeting` | `() → void` | Calls `tickClock()` once, then `setInterval(tickClock, 60000)` |

---

### 2. Focus Timer Widget

**Responsibility:** 25-minute countdown with Start, Stop, Reset controls and a session-end message.

**DOM elements:**
```html
<section id="focus-timer">
  <p id="timer-display">25:00</p>
  <p id="timer-message" hidden></p>  <!-- "Session complete!" -->
  <button id="timer-start">Start</button>
  <button id="timer-stop">Stop</button>
  <button id="timer-reset">Reset</button>
</section>
```

**Internal state (module-level variables in `app.js`):**
```js
let timerSeconds = 1500;   // 25 * 60
let timerInterval = null;  // setInterval handle or null
```

**Key functions:**
| Function | Signature | Description |
|---|---|---|
| `formatCountdown` | `(seconds: number) → string` | Returns `"MM:SS"` zero-padded string |
| `startTimer` | `() → void` | Guards against double-start; creates `setInterval` ticking every 1 s |
| `stopTimer` | `() → void` | Clears interval; retains remaining seconds |
| `resetTimer` | `() → void` | Clears interval; resets `timerSeconds` to 1500; hides message |
| `initTimer` | `() → void` | Renders initial display; wires Start/Stop/Reset click listeners |

**Timer tick logic:** Each second, decrement `timerSeconds`. If it reaches 0, clear the interval, display `"Session complete!"`, and show the message element.

---

### 3. Todo List Widget

**Responsibility:** CRUD operations on tasks with localStorage persistence and inline validation.

**DOM elements:**
```html
<section id="todo-list">
  <form id="todo-form">
    <input id="todo-input" type="text" maxlength="500" />
    <button type="submit">Add</button>
    <p id="todo-error" hidden></p>
  </form>
  <ul id="todo-items"></ul>
  <p id="todo-storage-warning" hidden></p>
</section>
```

**Rendered task item (generated by `renderTasks()`):**
```html
<li class="todo-item" data-id="0">
  <input type="checkbox" class="todo-check" />
  <span class="todo-desc">Task text</span>
  <!-- OR during edit: -->
  <input type="text" class="todo-edit-input" maxlength="500" value="Task text" />
  <button class="todo-save-btn">Save</button>
  <button class="todo-cancel-btn">Cancel</button>
  <!-- end edit -->
  <button class="todo-edit-btn">Edit</button>
  <button class="todo-delete-btn">Delete</button>
  <p class="todo-item-error" hidden></p>
</li>
```

**Key functions:**
| Function | Signature | Description |
|---|---|---|
| `validateTaskDescription` | `(text: string) → { valid: boolean, message: string }` | Pure; checks non-empty and ≤500 chars |
| `renderTasks` | `(tasks: Task[]) → void` | Clears `#todo-items` and re-renders all tasks |
| `addTask` | `(description: string) → void` | Validates, creates Task, saves, re-renders |
| `editTask` | `(index: number) → void` | Switches task item to edit mode |
| `saveEditTask` | `(index: number, newText: string) → void` | Validates, updates task, saves, re-renders |
| `cancelEditTask` | `(index: number) → void` | Re-renders without changes |
| `toggleTask` | `(index: number) → void` | Flips `completed`, saves, re-renders |
| `deleteTask` | `(index: number) → void` | Removes task at index, saves, re-renders |

**Event delegation:** A single `click` listener on `#todo-items` reads `data-id` and the clicked element's class to dispatch to the correct handler. The form `submit` listener handles add.

---

### 4. Quick Links Widget

**Responsibility:** Add, display, and delete URL shortcut buttons with localStorage persistence.

**DOM elements:**
```html
<section id="quick-links">
  <form id="links-form">
    <input id="link-label-input" type="text" maxlength="50" />
    <input id="link-url-input" type="url" />
    <button type="submit">Add Link</button>
    <p id="links-error" hidden></p>
  </form>
  <div id="links-container"></div>
  <p id="links-storage-warning" hidden></p>
</section>
```

**Rendered link item (generated by `renderLinks()`):**
```html
<div class="quick-link-item">
  <button class="quick-link-btn" data-url="https://...">Label</button>
  <button class="quick-link-delete-btn" data-index="0">×</button>
</div>
```

**Key functions:**
| Function | Signature | Description |
|---|---|---|
| `validateLinkLabel` | `(text: string) → { valid: boolean, message: string }` | Pure; checks 1–50 chars |
| `validateLinkUrl` | `(url: string) → { valid: boolean, message: string }` | Pure; checks `http(s)://` prefix + non-empty domain |
| `isDuplicateUrl` | `(url: string, links: Link[]) → boolean` | Pure; checks for existing URL in collection |
| `renderLinks` | `(links: Link[]) → void` | Clears `#links-container` and re-renders all links |
| `addLink` | `(label: string, url: string) → void` | Validates, checks duplicate/limit, creates Link, saves, re-renders |
| `deleteLink` | `(index: number) → void` | Removes link at index, saves, re-renders |
| `initQuickLinks` | `() → void` | Loads links, renders, wires form submit and container click listeners |

---

## Data Models

### Task Object

```js
/**
 * @typedef {Object} Task
 * @property {string} description - Task text, 1–500 characters
 * @property {boolean} completed  - true = done (strikethrough), false = pending
 */
```

Example:
```json
{ "description": "Write design doc", "completed": false }
```

### Link Object

```js
/**
 * @typedef {Object} Link
 * @property {string} label - Display text, 1–50 characters
 * @property {string} url   - Full URL beginning with http:// or https://
 */
```

Example:
```json
{ "label": "GitHub", "url": "https://github.com" }
```

### localStorage Schema

| Key | Type | Shape |
|---|---|---|
| `tld_tasks` | JSON string | `Task[]` — array of Task objects |
| `tld_links` | JSON string | `Link[]` — array of Link objects |

**Storage helpers:**

```js
// Returns Task[] or [] on any error
function loadTasks() {
  try {
    const raw = localStorage.getItem('tld_tasks');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    showCorruptionNotice('tasks');
    return [];
  }
}

// Returns true on success, false on quota/unavailability error
function saveTasks(tasks) {
  try {
    localStorage.setItem('tld_tasks', JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
```

Identical pattern for `loadLinks` / `saveLinks` using key `tld_links`.

---

## CSS Layout Strategy

### Grid Layout

The four widgets are placed in a CSS Grid container on `<main>` or `<body>`:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 24px;
}

@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

Each `<section>` widget occupies one grid cell. The Greeting Widget and Focus Timer sit in the top row; the Todo List and Quick Links sit in the bottom row. On narrow viewports all four stack vertically.

### Typography

```css
body {
  font-size: 16px;   /* ≥14px requirement */
}

h2, .widget-title {
  font-size: 20px;   /* ≥18px requirement */
}
```

### Widget Cards

Each widget is styled as a card with padding, a subtle border or box-shadow, and a minimum of 16 px internal spacing to satisfy the adjacency margin requirement.

### Responsive Breakpoints

| Viewport | Layout |
|---|---|
| ≥ 768 px | 2-column grid |
| < 768 px | 1-column stack |

---

## JS Organisation within app.js

`app.js` is structured as a single IIFE (Immediately Invoked Function Expression) or a flat sequence of function declarations grouped by section comment. No ES modules are used (no `import`/`export`) to avoid requiring a server for `file://` usage.

```
js/app.js
│
├── /* ── CONSTANTS ── */
│     STORAGE_KEY_TASKS, STORAGE_KEY_LINKS, MAX_TASK_LENGTH,
│     MAX_LINK_LABEL_LENGTH, MAX_LINKS, TIMER_DURATION
│
├── /* ── STORAGE HELPERS ── */
│     loadTasks(), saveTasks(), loadLinks(), saveLinks()
│
├── /* ── GREETING ── */
│     getGreeting(), formatTime(), formatDate(),
│     tickClock(), initGreeting()
│
├── /* ── FOCUS TIMER ── */
│     formatCountdown(), startTimer(), stopTimer(),
│     resetTimer(), initTimer()
│
├── /* ── TODO LIST ── */
│     validateTaskDescription(), renderTasks(),
│     addTask(), editTask(), saveEditTask(),
│     cancelEditTask(), toggleTask(), deleteTask(),
│     initTodoList()
│
├── /* ── QUICK LINKS ── */
│     validateLinkLabel(), validateLinkUrl(),
│     isDuplicateUrl(), renderLinks(),
│     addLink(), deleteLink(), initQuickLinks()
│
└── /* ── BOOTSTRAP ── */
      init()
      document.addEventListener('DOMContentLoaded', init)
```

---

## Event Handling Approach

- **Form submissions** (`todo-form`, `links-form`): `submit` event with `event.preventDefault()` to avoid page reload.
- **Timer buttons**: Direct `click` listeners on `#timer-start`, `#timer-stop`, `#timer-reset`.
- **Todo item actions** (edit, save, cancel, toggle, delete): Event delegation — one `click` listener on `#todo-items`; the handler reads `event.target.closest('[data-id]')` for the task index and `event.target.classList` to identify the action.
- **Quick link actions** (open, delete): Event delegation — one `click` listener on `#links-container`; dispatches on `quick-link-btn` vs `quick-link-delete-btn` class.
- **Clock tick**: `setInterval(tickClock, 60000)` started in `initGreeting()`.
- **Timer tick**: `setInterval` created in `startTimer()`, stored in `timerInterval`, cleared in `stopTimer()` and `resetTimer()`.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private mode, blocked) | `try/catch` in `loadTasks`/`loadLinks`; show persistent `#todo-storage-warning` / `#links-storage-warning`; operate in session-only mode |
| `localStorage` quota exceeded on write | `saveTasks`/`saveLinks` returns `false`; the calling mutation function blocks the operation and shows an inline error |
| Malformed JSON in `tld_tasks` | `JSON.parse` throws; caught in `loadTasks`; empty array returned; `showCorruptionNotice('tasks')` displays a visible UI notification |
| Malformed JSON in `tld_links` | Same pattern via `loadLinks` / `showCorruptionNotice('links')` |
| Invalid task input (empty / >500 chars) | `validateTaskDescription` returns `{ valid: false, message }` before any mutation; inline error shown in `#todo-error` or `.todo-item-error` |
| Invalid link input (bad label / URL / duplicate / limit) | `validateLinkLabel`, `validateLinkUrl`, `isDuplicateUrl` return validation results; inline error shown in `#links-error` |
| Timer double-start | `startTimer` guards with `if (timerInterval !== null) return` |
| Timer already at 0 when Start pressed | Guard: `if (timerSeconds <= 0) return` |

All user-facing error messages are shown inline (adjacent to the relevant form or item) and hidden when the next valid action succeeds.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Time formatting output format

*For any* `Date` object, `formatTime(date)` SHALL return a string of exactly 5 characters matching the pattern `HH:MM`, where `HH` is a zero-padded integer in the range 00–23 and `MM` is a zero-padded integer in the range 00–59.

**Validates: Requirements 1.2**

---

### Property 2: Date formatting output format

*For any* `Date` object, `formatDate(date)` SHALL return a string matching the pattern `"Weekday, DD Month YYYY"` where `Weekday` is one of the seven English weekday names, `DD` is a zero-padded day in 01–31, `Month` is one of the twelve English month names, and `YYYY` is a four-digit year.

**Validates: Requirements 1.3**

---

### Property 3: Greeting correctness for all hours

*For any* integer hour in the range 0–23:
- If `hour` is in [5, 11], `getGreeting(hour)` SHALL return `"Good Morning"`.
- If `hour` is in [12, 17], `getGreeting(hour)` SHALL return `"Good Afternoon"`.
- If `hour` is in [18, 20], `getGreeting(hour)` SHALL return `"Good Evening"`.
- If `hour` is in [0, 4] or [21, 23], `getGreeting(hour)` SHALL return `"Good Night"`.

Every integer in 0–23 maps to exactly one greeting; no hour is unhandled.

**Validates: Requirements 1.4, 1.5, 1.6, 1.7**

---

### Property 4: Countdown formatting output format

*For any* integer `seconds` in the range 0–1500, `formatCountdown(seconds)` SHALL return a string of exactly 5 characters matching the pattern `MM:SS`, where `MM` is a zero-padded integer in the range 00–25 and `SS` is a zero-padded integer in the range 00–59.

**Validates: Requirements 2.2**

---

### Property 5: Reset always restores initial state

*For any* timer state (any value of `timerSeconds` in 0–1500, and any value of `timerInterval`), calling `resetTimer()` SHALL result in `timerSeconds === 1500` and the timer display showing `"25:00"`, regardless of the prior state.

**Validates: Requirements 2.4**

---

### Property 6: Task addition correctness

*For any* task list of length `n` and any valid task description (a non-empty string of 1–500 characters), calling `addTask(description)` SHALL result in a task list of length `n + 1`, where the newly added task has `description` equal to the submitted text and `completed` equal to `false`.

**Validates: Requirements 3.1**

---

### Property 7: Task description validation rejects invalid input

*For any* string that is either empty, composed entirely of whitespace, or longer than 500 characters, `validateTaskDescription(text)` SHALL return an object with `valid === false` and a non-empty `message` string.

*For any* string of 1–500 characters that contains at least one non-whitespace character, `validateTaskDescription(text)` SHALL return an object with `valid === true`.

**Validates: Requirements 3.2, 3.5**

---

### Property 8: Task completion toggle round-trip

*For any* task with any `completed` state, toggling the task's completion state twice SHALL return the task to its original `completed` value. Toggling once SHALL produce the boolean complement of the original value.

**Validates: Requirements 3.6**

---

### Property 9: Collection deletion reduces length by exactly one

*For any* non-empty array of Tasks or Links of length `n`, and any valid index `i` in [0, n−1], deleting the item at index `i` SHALL produce an array of length `n − 1` in which no element retains the identity of the deleted item at position `i`.

**Validates: Requirements 3.7, 4.7**

---

### Property 10: Serialization round-trip preserves all fields

*For any* array of `Task` objects (each with `description: string` and `completed: boolean`), `JSON.parse(JSON.stringify(tasks))` SHALL produce an array of equal length where every element has the same `description` and `completed` values as the original.

*For any* array of `Link` objects (each with `label: string` and `url: string`), `JSON.parse(JSON.stringify(links))` SHALL produce an array of equal length where every element has the same `label` and `url` values as the original.

**Validates: Requirements 3.8, 3.9, 4.8, 4.9, 5.3, 5.4**

---

### Property 11: Link addition correctness

*For any* links collection of length `n` (where `n < 20`) and any valid label (1–50 characters) and valid URL (beginning with `http://` or `https://` followed by a non-empty domain) that is not already present in the collection, calling `addLink(label, url)` SHALL result in a collection of length `n + 1` where the newly added link has `label` and `url` equal to the submitted values.

**Validates: Requirements 4.1**

---

### Property 12: Link label validation rejects invalid input

*For any* string that is empty or longer than 50 characters, `validateLinkLabel(text)` SHALL return `{ valid: false }` with a non-empty `message`.

*For any* string of 1–50 characters, `validateLinkLabel(text)` SHALL return `{ valid: true }`.

**Validates: Requirements 4.2**

---

### Property 13: Link URL validation correctness

*For any* string that does not begin with `http://` or `https://`, or that has an empty domain after the prefix, `validateLinkUrl(url)` SHALL return `{ valid: false }` with a non-empty `message`.

*For any* string of the form `http://domain` or `https://domain` where `domain` is non-empty, `validateLinkUrl(url)` SHALL return `{ valid: true }`.

**Validates: Requirements 4.3**

---

### Property 14: Duplicate URL detection

*For any* links array and any URL string already present in that array, `isDuplicateUrl(url, links)` SHALL return `true`.

*For any* links array and any URL string not present in that array, `isDuplicateUrl(url, links)` SHALL return `false`.

**Validates: Requirements 4.4**

---

## Testing Strategy

### Approach

This feature is a pure-HTML/CSS/Vanilla-JS application with no build tooling. Testing is performed using a lightweight, zero-dependency property-based testing library loaded directly in the browser or via Node.js without a bundler.

**Recommended PBT library:** [fast-check](https://github.com/dubzzz/fast-check) — available as a single UMD bundle (`fast-check.min.js`) that can be loaded with a `<script>` tag in a test HTML file, requiring no build step.

### Dual Testing Approach

| Layer | Tool | Focus |
|---|---|---|
| Unit / example tests | Plain `console.assert` or a minimal test harness | Specific examples, edge cases, error conditions, DOM interactions |
| Property-based tests | `fast-check` (UMD bundle) | Universal properties across all valid inputs (Properties 1–14 above) |

### Property Test Configuration

- Each property test runs a **minimum of 100 iterations** (fast-check default is 100; set `numRuns: 100` explicitly).
- Each test is tagged with a comment referencing the design property:
  ```js
  // Feature: todo-life-dashboard, Property 3: Greeting correctness for all hours
  fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), (hour) => { ... }), { numRuns: 100 });
  ```

### Unit Test Focus Areas

- `initGreeting()` renders correct DOM content on load (Requirement 1.1).
- Timer start/stop/reset state transitions (Requirements 2.1, 2.3, 2.5).
- Edit mode pre-population and cancel behavior (Requirements 3.3, 3.4).
- `window.open` called with correct arguments on link click (Requirement 4.6).
- `localStorage` unavailability warning display (Requirements 3.10, 4.10, 4.11).
- Malformed JSON recovery and notification (Requirements 5.5, 5.6).
- Storage key names (`tld_tasks`, `tld_links`) (Requirements 5.1, 5.2).

### Property Test Coverage Map

| Property | Requirement(s) | Arbitraries |
|---|---|---|
| 1 — formatTime format | 1.2 | `fc.date()` |
| 2 — formatDate format | 1.3 | `fc.date()` |
| 3 — getGreeting all hours | 1.4–1.7 | `fc.integer({ min: 0, max: 23 })` |
| 4 — formatCountdown format | 2.2 | `fc.integer({ min: 0, max: 1500 })` |
| 5 — reset invariant | 2.4 | `fc.integer({ min: 0, max: 1500 })` |
| 6 — task addition | 3.1 | `fc.array(taskArb)`, `fc.string({ minLength: 1, maxLength: 500 })` |
| 7 — task description validation | 3.2, 3.5 | `fc.string()` (full range including empty and long) |
| 8 — toggle round-trip | 3.6 | `fc.boolean()` |
| 9 — deletion reduces length | 3.7, 4.7 | `fc.array(taskArb, { minLength: 1 })`, `fc.integer` index |
| 10 — serialization round-trip | 3.8, 4.8, 5.3 | `fc.array(taskArb)`, `fc.array(linkArb)` |
| 11 — link addition | 4.1 | `fc.array(linkArb, { maxLength: 19 })`, valid label/url arbitraries |
| 12 — link label validation | 4.2 | `fc.string()` |
| 13 — link URL validation | 4.3 | `fc.string()`, `fc.webUrl()` |
| 14 — duplicate URL detection | 4.4 | `fc.array(linkArb)`, `fc.string()` |
