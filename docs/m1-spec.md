# M1: Spec and Wireframes

## Theme
Campus Living is a planner for tasks and events with durations, tags, regex search and a weekly time cap. It is built with plain HTML, CSS and JavaScript.

## Data model
Each record is stored in localStorage under the key `campusliving:tasks`.

```json
{
  "id": "rec_0001",
  "title": "Study for calculus exam",
  "dueDate": "2026-10-20",
  "duration": 90,
  "tag": "Study",
  "createdAt": "2026-10-13T08:00:00.000Z",
  "updatedAt": "2026-10-13T08:00:00.000Z"
}
```

- `duration` is always stored in minutes. Conversion to hours happens only when showing it or when the user types it in hours.
- `dueDate` is a YYYY-MM-DD string. It is compared as text and never parsed with `new Date("YYYY-MM-DD")`, to avoid timezone shifts.
- `updatedAt` changes on every edit. `createdAt` never changes.
- Settings are stored under `campusliving:settings`: `{ name, unit: "minutes" | "hours", weeklyCapMinutes, tags }`.

## Dashboard definitions
- Total tasks: count of all records.
- Planned time: sum of `duration` across all records, shown in the chosen unit.
- Top tag: the tag used by the most records.
- Last 7 days trend: planned minutes per day, grouped by `dueDate`, for today and the 6 days before it.
- Cap: a weekly target set in Settings (in hours, stored in minutes). Under the cap, a polite live region says how much time is left. Over the cap, an assertive live region says by how much.

## Regex catalog (planned)

| Purpose | Pattern |
|---|---|
| Title, no edge spaces | `^\S(?:.*\S)?$` |
| Duration | `^(0\|[1-9]\d*)(\.\d{1,2})?$` |
| Date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$`, plus a real calendar check |
| Tag | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` |
| Duplicate word (advanced, back-reference) | `\b(\w+)\s+\1\b` |
| Tag filter in search | `^@tag:(\w+)\s*(.*)$` |
| Time token in search | `\b\d{2}:\d{2}\b` |

## Accessibility plan
- Landmarks: `header`, `nav`, `main`, `section` and `footer`, with one `h1` and headings that never skip a level.
- A skip-to-content link is the first focusable element.
- Every input has a bound `<label>`. Errors appear as text next to the field and are announced through `aria-live`.
- A visible focus outline on all interactive elements.
- Status messages use `role="status"` (polite). The over-cap message uses `role="alert"` (assertive).
- Everything works with the keyboard alone. Delete uses a native `<dialog>` that traps focus and closes with Esc.
- Text colors meet WCAG AA contrast (4.5:1). Light pink and yellow are used for backgrounds only.
- Mobile first, with breakpoints at about 360px, 768px and 1024px.
- Animations are turned off for users who prefer reduced motion.

## Wireframes

### Mobile (360px): tasks as cards, menu at the bottom
```
+--------------------------+
| Campus Living            |
+--------------------------+
| Search regex: [_______]  |
| [x] Ignore case          |
| Sort: [Due date v]       |
+--------------------------+
| Study for calculus       |
| Due date: 2026-10-20     |
| Duration: 90 min         |
| Tag: Study               |
| [Edit] [Delete]          |
+--------------------------+
| Club meeting             |
| ...                      |
+--------------------------+
| Dash | Tasks | Add | Set | About |
+--------------------------+
```

### Desktop (1024px): sidebar, dashboard and table
```
+-----------+--------------------------------------+
| Campus    | Dashboard                            |
| Living    | Total: 12 | Planned: 24 h | Top: Exam|
|           | Weekly cap [=========>    ] 6h left |
| Dashboard | Last 7 days:  |  ||  |||  |  ||| |   |
| My tasks  +--------------------------------------+
| Add task  | Title      | Due date  | Dur | Tag   |
| Settings  | Study ...  | 2026-10-20| 90m | Study |
| About     |                       [Edit][Delete] |
+-----------+--------------------------------------+
```

### Add/Edit form
```
Title      [______________]   (error text here)
Due date   [YYYY-MM-DD    ]   (error text here)
Duration   [____] minutes     (error text here)
Tag        [Study         ]   (error text here)
[Save task]  [Cancel]
```

## Pages
About, Dashboard, My tasks (records), Add/Edit, Settings. All five live in one `index.html`, and the JavaScript shows one section at a time based on the URL hash.