# Project Structure

```
CodingCamp-18May26-aditiaputra/
├── index.html          # Single entry point — all widget markup lives here
├── css/
│   └── style.css       # All styles (layout, widgets, responsive breakpoints)
├── js/
│   └── app.js          # All JavaScript logic (no other JS files)
└── .kiro/
    ├── specs/
    │   └── todo-life-dashboard/
    │       └── requirements.md   # Feature requirements spec
    └── steering/
        ├── product.md
        ├── tech.md
        └── structure.md
```

## Layout Rules

- `index.html` contains the four widget sections: `#greeting`, `#focus-timer`, `#todo-list`, `#quick-links`
- Grid layout at ≥768px viewport (minimum 2 columns); single-column stack below 768px
- Minimum 16px margin or visible border between adjacent widgets
- Body font ≥14px, headings ≥18px

## File Responsibilities

| File | Responsibility |
|------|---------------|
| `index.html` | Static markup, widget containers, form elements |
| `css/style.css` | All visual styling and responsive layout |
| `js/app.js` | All logic: clock, timer, todo CRUD, quick links, localStorage |

## localStorage Keys

| Key | Contents |
|-----|----------|
| `tld_tasks` | JSON array of task objects `{ description, completed }` |
| `tld_links` | JSON array of link objects `{ label, url }` |

## Constraints

- Do not add additional JS or CSS files — keep everything in `app.js` and `style.css`
- Do not introduce any `<script>` tags in the HTML body
- Do not add any npm/yarn/build configuration files
