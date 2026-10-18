// ui.js
// This file draws things on the page. It never saves or changes data.

import { minutesToText } from "./state.js";

function byId(id) {
  return document.getElementById(id);
}

// ---------- showing one page at a time ----------
export function showPage(name) {
  const pages = document.querySelectorAll(".page");
  for (let i = 0; i < pages.length; i++) {
    pages[i].hidden = pages[i].id !== name;
  }
  // mark the current link in the menu
  const links = document.querySelectorAll(".nav-list a");
  for (let i = 0; i < links.length; i++) {
    if (links[i].getAttribute("href") === "#" + name) {
      links[i].setAttribute("aria-current", "page");
    } else {
      links[i].removeAttribute("aria-current");
    }
  }
}

// message for screen readers (e.g. "Task deleted")
export function announce(message) {
  byId("app-status").textContent = message;
}

// ---------- highlighting search matches ----------
// I build text nodes and <mark> elements instead of using innerHTML,
// so nothing the user typed can be treated as HTML.
function addHighlighted(parent, text, re) {
  if (!re) {
    parent.appendChild(document.createTextNode(text));
    return;
  }
  // I need the "g" flag to find every match
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const globalRe = new RegExp(re.source, flags);

  let last = 0;
  let match;
  while ((match = globalRe.exec(text)) !== null) {
    if (match[0] === "") {
      globalRe.lastIndex++;   // empty match (like a*), skip it so we don't loop forever
      continue;
    }
    parent.appendChild(document.createTextNode(text.slice(last, match.index)));
    const mark = document.createElement("mark");
    mark.textContent = match[0];
    parent.appendChild(mark);
    last = match.index + match[0].length;
  }
  parent.appendChild(document.createTextNode(text.slice(last)));
}

// ---------- the records table ----------
function makeCell(label) {
  const td = document.createElement("td");
  td.setAttribute("data-label", label);   // CSS shows this label on phones
  return td;
}

export function renderTable(list, re, unit) {
  const body = byId("records-body");
  body.innerHTML = "";

  byId("empty-state").hidden = list.length > 0;
  byId("records-table").hidden = list.length === 0;

  for (let i = 0; i < list.length; i++) {
    const task = list[i];
    const row = document.createElement("tr");

    const titleCell = makeCell("Title");
    addHighlighted(titleCell, task.title, re);

    const dateCell = makeCell("Due date");
    dateCell.textContent = task.dueDate;

    const durationCell = makeCell("Duration");
    durationCell.textContent = minutesToText(task.duration, unit);

    const tagCell = makeCell("Tag");
    addHighlighted(tagCell, task.tag, re);

    const actionsCell = makeCell("Actions");

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("data-action", "edit");
    editBtn.setAttribute("data-id", task.id);
    editBtn.setAttribute("aria-label", "Edit " + task.title);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";
    deleteBtn.setAttribute("data-action", "delete");
    deleteBtn.setAttribute("data-id", task.id);
    deleteBtn.setAttribute("aria-label", "Delete " + task.title);

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(deleteBtn);

    row.appendChild(titleCell);
    row.appendChild(dateCell);
    row.appendChild(durationCell);
    row.appendChild(tagCell);
    row.appendChild(actionsCell);
    body.appendChild(row);
  }
}

// ---------- dashboard ----------

// a date as "YYYY-MM-DD" using local time (avoids timezone shifts)
function dateToText(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// the last 7 days, oldest first, ending today
function lastSevenDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      text: dateToText(date),
      label: date.toLocaleDateString("en-US", { weekday: "short" })
    });
  }
  return days;
}

export function renderGreeting(settings) {
  const greeting = byId("greeting");
  if (settings.name) {
    greeting.textContent = "Hey " + settings.name + "!";
  } else {
    greeting.textContent = "";
  }
}

export function renderStats(tasks, settings) {
  byId("stat-total").textContent = tasks.length;

  let total = 0;
  const counts = {};
  for (let i = 0; i < tasks.length; i++) {
    total += tasks[i].duration;
    counts[tasks[i].tag] = (counts[tasks[i].tag] || 0) + 1;
  }
  byId("stat-duration").textContent = minutesToText(total, settings.unit);

  // top tag = the tag used most often
  let topTag = "None yet";
  let topCount = 0;
  for (const tag in counts) {
    if (counts[tag] > topCount) {
      topCount = counts[tag];
      topTag = tag;
    }
  }
  byId("stat-tag").textContent = topTag;

  renderTrendAndCap(tasks, settings);
}

function renderTrendAndCap(tasks, settings) {
  const days = lastSevenDays();

  // minutes planned for each of the 7 days
  const perDay = [];
  let weekTotal = 0;
  let biggest = 0;
  for (let i = 0; i < days.length; i++) {
    let minutes = 0;
    for (let j = 0; j < tasks.length; j++) {
      if (tasks[j].dueDate === days[i].text) {
        minutes += tasks[j].duration;
      }
    }
    perDay.push(minutes);
    weekTotal += minutes;
    if (minutes > biggest) {
      biggest = minutes;
    }
  }

  // --- chart ---
  const chart = byId("trend-chart");
  chart.innerHTML = "";
  const summary = [];
  for (let i = 0; i < days.length; i++) {
    const col = document.createElement("div");
    col.className = "bar-col";

    const bar = document.createElement("div");
    bar.className = "bar";
    const percent = biggest === 0 ? 0 : (perDay[i] / biggest) * 85;
    bar.style.height = percent + "%";

    const label = document.createElement("span");
    label.textContent = days[i].label;

    col.appendChild(bar);
    col.appendChild(label);
    chart.appendChild(col);

    summary.push(days[i].label + " " + minutesToText(perDay[i], settings.unit));
  }
  chart.setAttribute("aria-label", "Planned time for the last 7 days: " + summary.join(", "));

  // --- cap ---
  const cap = settings.weeklyCapMinutes;
  const fill = byId("cap-fill");
  const polite = byId("cap-polite");
  const alertBox = byId("cap-alert");

  const percentUsed = cap > 0 ? Math.min(100, (weekTotal / cap) * 100) : 0;
  fill.style.width = percentUsed + "%";

  if (weekTotal <= cap) {
    fill.classList.remove("over");
    alertBox.textContent = "";
    polite.textContent = minutesToText(cap - weekTotal, settings.unit) + " left of your weekly cap.";
  } else {
    fill.classList.add("over");
    polite.textContent = "";
    alertBox.textContent = "Over your weekly cap by " + minutesToText(weekTotal - cap, settings.unit) + ".";
  }
}

// ---------- settings page ----------
export function renderTagOptions(tags) {
  // suggestions in the task form
  const list = byId("tag-options");
  list.innerHTML = "";
  for (let i = 0; i < tags.length; i++) {
    const option = document.createElement("option");
    option.value = tags[i];
    list.appendChild(option);
  }

  // the pills in settings, each with a remove button
  const pills = byId("tag-list");
  pills.innerHTML = "";
  for (let i = 0; i < tags.length; i++) {
    const li = document.createElement("li");
    li.appendChild(document.createTextNode(tags[i]));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "x";
    remove.setAttribute("data-tag", tags[i]);
    remove.setAttribute("aria-label", "Remove tag " + tags[i]);
    li.appendChild(remove);
    pills.appendChild(li);
  }
}