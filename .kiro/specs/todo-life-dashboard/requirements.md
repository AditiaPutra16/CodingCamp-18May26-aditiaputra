# Requirements Document

## Introduction

The Todo-Life Dashboard is a client-side, single-page web application that serves as a personal productivity hub. It combines a live greeting with the current time and date, a Pomodoro-style focus timer, a persistent to-do list, and a quick-links panel — all in one clean, minimal interface. No backend or build tooling is required; all data is stored in the browser's Local Storage.

The application is built with plain HTML, CSS, and Vanilla JavaScript, and must work as a standalone web page or browser extension in all modern browsers (Chrome, Firefox, Edge, Safari).

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI section that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The UI section that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Todo_List**: The UI section that manages a user's task items.
- **Task**: A single to-do item with a text description and a completion state.
- **Quick_Links**: The UI section that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari at their current stable release.

---

## Requirements

### Requirement 1: Live Greeting

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I have an immediate sense of the time of day without checking another app.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting_Widget SHALL immediately display the current local time in HH:MM (24-hour) format.
2. WHEN the system clock advances to a new minute, THE Greeting_Widget SHALL update the displayed time to reflect the new HH:MM value.
3. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 26 May 2025").
4. IF the local time is between 05:00 and 11:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Morning".
5. IF the local time is between 12:00 and 17:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Afternoon".
6. IF the local time is between 18:00 and 20:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Evening".
7. IF the local time is between 21:00 and 23:59 inclusive or between 00:00 and 04:59 inclusive, THEN THE Greeting_Widget SHALL display the greeting "Good Night".
8. WHEN the system clock advances to a new minute, THE Greeting_Widget SHALL re-evaluate the time-of-day condition and update the greeting if the time boundary has been crossed.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can work in focused Pomodoro-style sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control and the Focus_Timer is not already counting down, THE Focus_Timer SHALL begin counting down one second at a time and display the remaining time in MM:SS format, updated every second.
3. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00, regardless of whether the timer expired naturally or was stopped manually.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a distinct session-end message (e.g., "Session complete!") that remains visible until the Reset control is activated.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks in a persistent to-do list, so that I can track my work items across browser sessions without losing data.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task description of 1–500 characters, THE Todo_List SHALL add a new Task with that description and a default completion state of incomplete.
2. IF the user submits an empty task description or a description exceeding 500 characters, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control on a Task, THE Todo_List SHALL display a pre-populated editable field containing the Task's current description (max 500 characters) and a save trigger.
4. WHEN the user activates the cancel control during an edit, THE Todo_List SHALL discard any changes and restore the Task to its previous display state.
5. IF the user saves an edited Task with an empty description or a description exceeding 500 characters, THEN THE Todo_List SHALL reject the save and display an inline validation message.
6. WHEN the user toggles the completion control on a Task, THE Todo_List SHALL update the Task's completion state and apply a strikethrough style to the description text of completed Tasks.
7. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list permanently.
8. WHEN any Task is added, edited, completed, or deleted, THE Todo_List SHALL persist the full updated task collection to Local_Storage; IF persistence fails due to a storage error or quota limit, THEN THE Todo_List SHALL block the operation and display an inline error message to the user.
9. WHEN the Dashboard loads, THE Todo_List SHALL read the task collection from Local_Storage and automatically render all previously saved Tasks.
10. WHERE Local_Storage is unavailable, THE Todo_List SHALL display a persistent warning message indicating that tasks will not be saved across sessions, and SHALL operate in session-only mode.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and manage shortcut buttons to my favourite websites, so that I can open them quickly from the Dashboard without typing URLs.

#### Acceptance Criteria

1. WHEN the user provides a label (1–50 characters) and a valid URL (beginning with `http://` or `https://` followed by a non-empty domain) and activates the add control, THE Quick_Links SHALL add a new Link and display it as a clickable button.
2. IF the user activates the add control with an empty label or a label exceeding 50 characters, THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
3. IF the user activates the add control with an empty URL, a URL that does not begin with `http://` or `https://`, or a URL with an empty domain after the prefix, THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
4. IF the user activates the add control with a URL that is already present in the Quick_Links collection, THEN THE Quick_Links SHALL reject the submission and display an inline validation message indicating a duplicate.
5. IF the Quick_Links collection already contains 20 Links, THEN THE Quick_Links SHALL reject any further add attempts and display an inline message indicating the maximum limit has been reached.
6. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
7. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove the Link from the panel display and from Local_Storage permanently.
8. WHEN any Link is added or deleted, THE Quick_Links SHALL persist the full updated link collection to Local_Storage.
9. WHEN the Dashboard loads, THE Quick_Links SHALL read the link collection from Local_Storage and automatically restore and display all previously saved Links.
10. IF Local_Storage is unavailable, THEN THE Quick_Links SHALL display a confirmation prompt to the user before enabling session-only mode.
11. IF the user confirms the session-only prompt, THEN THE Quick_Links SHALL proceed without persistence for the current session.

---

### Requirement 5: Data Persistence and Storage

**User Story:** As a user, I want all my tasks and quick links to survive page refreshes and browser restarts, so that I never have to re-enter data I have already saved.

#### Acceptance Criteria

1. THE Dashboard SHALL store the task collection under the dedicated Local_Storage key `tld_tasks`.
2. THE Dashboard SHALL store the link collection under the dedicated Local_Storage key `tld_links`.
3. WHEN any mutation occurs to the task or link collection, THE Dashboard SHALL serialise the affected collection as a valid JSON string and write it to the corresponding Local_Storage key.
4. WHEN data is read from Local_Storage, THE Dashboard SHALL deserialise the JSON string and restore each item's fields: for tasks, the description and completion state; for links, the label and URL.
5. IF the JSON string stored under `tld_tasks` is malformed, THEN THE Dashboard SHALL discard the corrupted task data, initialise an empty task collection, and display a visible UI notification to the user.
6. IF the JSON string stored under `tld_links` is malformed, THEN THE Dashboard SHALL discard the corrupted link data, initialise an empty link collection, and display a visible UI notification to the user.

---

### Requirement 6: Layout and Visual Design

**User Story:** As a user, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without visual clutter or confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL organise all four widgets (Greeting_Widget, Focus_Timer, Todo_List, Quick_Links) in a single-page layout with a minimum of 16px margin or a visible border between adjacent widgets.
2. THE Dashboard SHALL apply a body font size of at least 14px and a heading font size of at least 18px throughout the interface.
3. THE Dashboard SHALL use a single CSS file located at `css/style.css`.
4. THE Dashboard SHALL use a single JavaScript file located at `js/app.js`.
5. WHILE the viewport width is 768px or wider, THE Dashboard SHALL display widgets in a grid layout with a minimum of 2 columns.
6. WHILE the viewport width is below 768px, THE Dashboard SHALL display widgets in a single-column stacked layout.
