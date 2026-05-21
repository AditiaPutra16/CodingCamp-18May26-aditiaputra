# Tech Stack

## Languages & Technologies

- **HTML5** — single `index.html` entry point
- **CSS3** — all styles in `css/style.css`
- **Vanilla JavaScript (ES6+)** — all logic in `js/app.js`
- No frameworks, no libraries, no package managers, no build tools

## Browser APIs Used

- `localStorage` — data persistence for tasks and quick links
- `setInterval` / `Date` — live clock and focus timer
- `window.open` — opening quick links in new tabs

## Compatibility Target

Chrome, Firefox, Edge, Safari — current stable releases only.

## Common Commands

No build step required. Open `index.html` directly in a browser:

```
# Open in default browser (Windows)
start index.html

# Or simply double-click index.html in the file explorer
```

For live-reload during development, use VS Code's **Live Server** extension or any static file server:

```
# Python (if available)
python -m http.server 8080
```

## Code Style Guidelines

- Use `const` by default; `let` only when reassignment is needed; never `var`
- Prefer `addEventListener` over inline `on*` HTML attributes
- Keep all DOM manipulation inside `js/app.js` — no `<script>` tags in HTML body
- Use `JSON.stringify` / `JSON.parse` for all `localStorage` reads and writes
- Wrap `localStorage` access in `try/catch` to handle quota errors and unavailability
- CSS class names use kebab-case (e.g., `.todo-item`, `.quick-link-btn`)
- JavaScript identifiers use camelCase
