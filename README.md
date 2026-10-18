# Campus Living

Campus Living is a small planner I built for university students who need to keep track of assignments, study sessions, club meetings and personal plans in one place. You add a task with a due date, a duration and a tag, and the app shows how much time you have planned this week compared to a weekly cap you set yourself.

It is built with plain HTML, CSS and JavaScript. There are no frameworks and no libraries. Everything is saved in the browser, so there is no account and no server.

- **Theme chosen:** Campus Life Planner (tasks and events, durations, tags, search)
- **Live site (GitHub Pages):** https://gidoko-codes.github.io/campus-life-planner/
- **Demo video (unlisted):** ADD-YOUR-VIDEO-LINK-HERE
- **Author:** gidoko-codes, g.idoko@alustudent.com

---

## Table of contents

1. [Features](#features)
2. [Pages](#pages)
3. [Data model](#data-model)
4. [Regex catalog](#regex-catalog)
5. [Search syntax](#search-syntax)
6. [Keyboard map](#keyboard-map)
7. [Accessibility notes](#accessibility-notes)
8. [Responsive design](#responsive-design)
9. [Project structure](#project-structure)
10. [How to run it](#how-to-run-it)
11. [How to run the tests](#how-to-run-the-tests)
12. [Import and export](#import-and-export)
13. [Design decisions](#design-decisions)
14. [Known limits](#known-limits)

---

## Features

- Add, edit and delete tasks, with a confirmation popup before anything is deleted.
- Every field is checked with a regular expression while you type, with clear messages next to the field.
- A warning (not a blocking error) when a title repeats a word, like "study study".
- Sort by due date, title (A to Z or Z to A) or duration (shortest or longest first).
- Live regex search with a case-insensitive toggle. Matches are highlighted with `<mark>`.
- Invalid search patterns never crash the page. The app just says the pattern is not valid yet.
- Dashboard with total tasks, total planned time, the most used tag and a 7 day bar chart.
- A weekly time cap. When you are under it, a polite message tells you how much time is left. When you go over, an assertive message tells you by how much.
- Settings for your name (used in the greeting), duration unit (minutes or hours), weekly cap and the list of tags.
- Everything saves automatically to `localStorage`, so a refresh never loses your data.
- JSON export and import. Imported files are checked before they are loaded.
- Works with a keyboard only, and is laid out mobile first.

## Pages

| Page | What it is for |
|---|---|
| Dashboard | Stats, the weekly cap bar and the last 7 days chart |
| My tasks | Search, sort, and the list of tasks (a table on wide screens, cards on phones) |
| Add task | The form for adding a new task or editing an existing one |
| Settings | Name, unit, weekly cap, tags, and JSON import and export |
| About | Why I built it and how to contact me |

The app is one `index.html`. The menu links use `#dashboard`, `#records`, `#form`, `#settings` and `#about`, and the JavaScript shows one section at a time based on the URL hash. This means the browser back button works as expected.

## Data model

Every task has a unique id and timestamps.

```json
{
  "id": "rec_0001",
  "title": "Study for calculus exam",
  "dueDate": "2026-10-18",
  "duration": 120,
  "tag": "Exam",
  "createdAt": "2026-10-11T08:00:00.000Z",
  "updatedAt": "2026-10-11T08:00:00.000Z"
}
```

- `duration` is **always stored in minutes**. It is only converted to hours when it is shown on screen or when the user types it in hours. This keeps the data safe if the unit is switched in Settings.
- `dueDate` is a `YYYY-MM-DD` text value. It is compared as text and never passed through `new Date("YYYY-MM-DD")`, because that can shift the day by a timezone.
- `updatedAt` changes on every edit. `createdAt` never changes.
- Ids are `rec_` plus a number. A new id uses the biggest existing number plus one, so a deleted id is not reused.
- Settings are saved separately from tasks: name, unit, weekly cap in minutes and the tag list.

Storage keys: `campusliving:tasks` and `campusliving:settings`.

## Regex catalog

All validation patterns live in `scripts/validators.js` in one exported object, so they are easy to find and test.

| Purpose | Pattern | Valid example | Invalid example |
|---|---|---|---|
| Title (no space at the start or end) | `^\S(?:.*\S)?$` | `Study for exam` | ` Study`, `Study ` |
| Duration (whole number or 1 to 2 decimals, no leading zeros) | `^(0\|[1-9]\d*)(\.\d{1,2})?$` | `90`, `1.5` | `007`, `1.555` |
| Date (YYYY-MM-DD shape) | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | `2026-10-20` | `20-10-2026` |
| Tag (letters, with single spaces or hyphens between words) | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` | `Part-time` | `Math101` |
| **Advanced:** repeated word (back-reference) | `\b(\w+)\s+\1\b` | matches `study study` | does not match `study hard` |
| `@tag:` filter in search | `^@tag:(\w+)\s*(.*)$` | `@tag:exam` | `tag:exam` |

Extra checks that are not pure regex:

- **Real calendar date.** The date pattern accepts `2026-02-30`, so a second check builds a `Date` and confirms the year, month and day did not roll over. `2028-02-29` is accepted and `2026-02-29` is rejected.
- **Duration above zero.** The pattern allows `0`, so a separate check rejects it.

The weekly cap in Settings reuses the duration pattern.

### Edge cases covered by the tests

Leading and trailing spaces, an empty title, a leap day in a leap year, a fake leap day, February 30, the wrong date format, a leading zero in the duration, three decimals, a digit inside a tag, and a repeated word.

## Search syntax

Type into the search box on the **My tasks** page. The pattern is matched against the title, the tag and the due date.

| You type | What you get |
|---|---|
| `^lab` | Titles or tags that start with "lab" |
| `\b\d{2}:\d{2}\b` | Titles with a time like `14:30` |
| `\b(\w+)\s+\1\b` | Titles with a repeated word, like "the the" |
| `2026-10` | Anything due in October 2026 |
| `@tag:exam` | Only tasks tagged Exam |
| `@tag:exam physics` | Exam tasks that also match "physics" |
| `(` | Not a valid pattern, so the page says "That pattern is not valid yet" and keeps working |

The **Ignore upper/lower case** box turns the `i` flag on or off.

How it stays safe:

- The pattern is compiled inside `try/catch` in `scripts/search.js`, and an error returns `null` instead of throwing.
- Highlighting is done by building text nodes and `<mark>` elements in code. It never uses `innerHTML` with user text, so nothing typed can become HTML.
- The highlighter forces the global flag and skips empty matches, so patterns like `a*` cannot cause an endless loop.

## Keyboard map

The whole app can be used without a mouse.

| Key | What it does |
|---|---|
| `Tab` | Move to the next link, field or button |
| `Shift` + `Tab` | Move to the previous one |
| First `Tab` on a page | Reveals the "Skip to main content" link |
| `Enter` on "Skip to main content" | Jumps straight to the page content |
| `Enter` on a menu link | Opens that page |
| `Enter` or `Space` on a button | Presses it (Edit, Delete, Add tag, Save, Cancel) |
| `Enter` inside the add or edit form | Saves the task |
| `Space` on the checkbox | Turns case-insensitive search on or off |
| `Arrow keys` on the Minutes and Hours radios | Switches the unit |
| `Arrow keys` on the sort dropdown | Changes the sort order |
| `Esc` in the delete popup | Closes it without deleting |
| Focus after the popup closes | Returns to where you were |

Moving to a new page also moves focus to the main area, so screen reader and keyboard users start at the top of the new content.

## Accessibility notes

- **Landmarks:** `header`, `nav`, `main`, `section` and `footer`, with one `h1` and headings that never skip a level.
- **Skip link:** the first focusable element on the page.
- **Labels:** every input has a `<label>` tied to it with `for` and `id`. Related radios are grouped in a `fieldset` with a `legend`.
- **Errors and hints:** inputs use `aria-describedby` so a screen reader reads the hint and the error together with the field.
- **Live regions:**
  - `role="status"` (polite) for the search result count, form status, settings status and the cap message when you are under the cap.
  - `role="alert"` (assertive) for the cap message when you go over it.
  - A hidden status area announces actions such as "Task added", "Task updated", "Task deleted" and "Tasks imported".
- **Table:** it has a caption and `scope="col"` on every column heading. The Edit and Delete buttons have labels that include the task name, such as "Delete Movie night".
- **Chart:** the 7 day chart has `role="img"` and an `aria-label` that lists every day and its planned time, so it is not only visual.
- **Focus:** a clear 3px outline on every link, button, input and select. The current page link in the menu uses `aria-current="page"`.
- **Delete confirmation:** it uses the native `<dialog>` element, which traps focus and closes with `Esc`.
- **Contrast:** text uses a dark ink (`#3B2A2F`) on cream, and buttons use a deep rose (`#B0334F`) with white text. The light pink and yellow are only used as backgrounds. Input borders use a darker tone so they are easy to see.
- **Motion:** animations are switched off for anyone who has "reduce motion" turned on in their device settings.

## Responsive design

The CSS is written mobile first and uses Flexbox and Grid. Three breakpoints:

| Width | Layout |
|---|---|
| Under 768px (phones, around 360px) | Menu is a bar fixed to the bottom. Tasks are stacked cards. Each card shows its own labels. |
| 768px and up (tablets) | Menu moves to the top. Tasks become a real table. The search bar sits in one row. |
| 1024px and up (desktop) | The header becomes a fixed sidebar on the left, and the content sits to the right of it. |

Animations used: a short fade-up when a page or task card appears, a sliding cap bar, growing chart bars, and a small lift on button hover.

## Project structure

```
campus-life-planner/
├── index.html          the single page with all five sections
├── tests.html          small browser tests for validators and state helpers
├── seed.json           12 sample records, including tricky cases
├── README.md
├── .gitignore
├── styles/
│   └── main.css        mobile first styles and the media queries
├── scripts/
│   ├── main.js         wires events to the other modules
│   ├── validators.js   regex patterns and checking functions
│   ├── storage.js      localStorage save and load, JSON import checks
│   ├── state.js        the task list, add, edit, delete, sort, unit conversion
│   ├── ui.js           draws the table, stats, chart, cap message and tags
│   └── search.js       safe regex compiler and the task filter
├── assets/
└── docs/
    └── m1-spec.md      data model, wireframes and the accessibility plan
```

Each file has one job. `ui.js` only draws and never saves. `storage.js` only talks to `localStorage`. `state.js` is the single place the task list is changed.

## How to run it

The scripts use ES modules, so the page must be served from a web server. Opening `index.html` by double clicking it will not work.

**Option 1: VS Code**
1. Install the **Live Server** extension.
2. Right click `index.html` and choose **Open with Live Server**.

**Option 2: Python**
```bash
cd campus-life-planner
python3 -m http.server 8000
```
Then open http://localhost:8000.

**Or just use the live site:** https://gidoko-codes.github.io/campus-life-planner/

To start with sample data, go to **Settings**, then **Your data**, choose **Import from JSON** and pick `seed.json`.

## How to run the tests

1. Serve the project as described above.
2. Open `/tests.html` in the browser.
3. Every line on the page should start with `PASS`.

The page checks:

- Title, date, duration and tag rules, including a leap day, a fake leap day, February 30, a leading zero and too many decimals
- The repeated word warning
- Sorting by date and by duration
- Minutes to hours conversion in both directions

If a test fails, the line starts with `FAIL` and names the case.

## Import and export

- **Export** downloads all tasks as `campus-living-tasks.json`.
- **Import** reads a `.json` file and checks it before touching your data:
  - The file must be valid JSON.
  - It must contain a list.
  - Every record needs an `id`, `title`, `dueDate`, `duration` (a number above 0, in minutes), `tag`, `createdAt` and `updatedAt`.
  - If any record is wrong, nothing is imported, and the message says which record has the problem.
- A successful import replaces the current tasks.

### What `seed.json` contains

12 records made to test the app, including time tokens (`Lab at 14:30`), a repeated word (`the the`), a 5 minute task, a 12 hour task, special characters in a title (`C++ notes (chapter 3)`), a leap day in 2028, a hyphenated tag, and dates inside the last 7 days so the chart has bars. That week adds up to more than the default 20 hour cap, so the over-the-cap message shows.

## Design decisions

- **"Last 7 days" and the weekly cap** both use the same window: today and the 6 days before it, grouped by due date. The cap compares the planned minutes in that window with the cap you set.
- **Durations are stored in minutes** and only converted at the edges, to avoid mixed units.
- **The date field is a text input**, not `type="date"`, so the app's own regex rule does the checking.
- **Tags use a `<datalist>`**, so you can pick a saved tag or type a new one, and the tag rule still applies to whatever you type. A new tag is added to your list when you save the task.
- **Colors:** cream, rose and butter yellow, with a handwritten font (Caveat) for the logo and DM Sans for everything else.

## Known limits

- Data lives only in one browser on one device. Use Export and Import to move it.
- Clearing the browser's site data deletes the tasks.
- The chart only looks at the last 7 days, so tasks due later do not appear in it or in the cap.
- Importing replaces the current tasks instead of merging with them.
- No dark mode, CSV export or offline mode yet.

## Milestones

| Milestone | Status |
|---|---|
| M1 Spec and wireframes (`docs/m1-spec.md`) | Done |
| M2 Semantic HTML and base CSS | Done |
| M3 Forms and regex validation, with `tests.html` | Done |
| M4 Render, sort and regex search | Done |
| M5 Stats, cap and ARIA live updates | Done |
| M6 Persistence, import and export, settings | Done |
| M7 Polish, accessibility pass, README and demo video | Done |