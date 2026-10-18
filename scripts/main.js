// main.js
// This file connects everything: it listens for clicks and typing,
// then calls the other files to do the work.

import { patterns, checkTitle, checkDuplicateWord, checkDate, checkDuration, checkTag } from "./validators.js";
import {
  getTasks, getSettings, getTaskById, addTask, updateTask, deleteTask,
  replaceTasks, updateSettings, sortTasks, inputToMinutes, minutesToInput
} from "./state.js";
import { parseImport } from "./storage.js";
import { filterTasks } from "./search.js";
import {
  showPage, announce, renderTable, renderGreeting, renderStats, renderTagOptions
} from "./ui.js";

function byId(id) {
  return document.getElementById(id);
}

// ---------- redraw everything ----------
function refresh() {
  const settings = getSettings();
  const sorted = sortTasks(getTasks(), byId("sort-select").value);
  const result = filterTasks(sorted, byId("search-input").value, byId("search-case").checked);

  renderTable(result.list, result.regex, settings.unit);
  renderStats(getTasks(), settings);
  renderGreeting(settings);
  renderTagOptions(settings.tags);
  byId("duration-unit").textContent = settings.unit;

  const message = byId("search-message");
  if (result.error) {
    message.textContent = "That pattern is not valid yet.";
  } else if (byId("search-input").value.trim() !== "") {
    message.textContent = result.list.length + " match(es).";
  } else {
    message.textContent = "";
  }
}

// ---------- navigation ----------
function goToPage() {
  let name = window.location.hash.replace("#", "");

  //the skip  link uses #main, so just move focus and stay on this page
  if(name === "main") {
    byId("main").focus();
    return;
  }
  
  const allowed = ["dashboard", "records", "form", "settings", "about"];
  if (!allowed.includes(name)) {
    name = "dashboard";
  }
  showPage(name);
  byId("main").focus();
}
window.addEventListener("hashchange", goToPage);

// ---------- the add / edit form ----------
const fields = [
  { input: "task-title", error: "title-error", check: checkTitle },
  { input: "task-date", error: "date-error", check: checkDate },
  { input: "task-duration", error: "duration-error", check: checkDuration },
  { input: "task-tag", error: "tag-error", check: checkTag }
];

// checks one field and shows or clears its message
function validateField(field) {
  const input = byId(field.input);
  const message = field.check(input.value);
  byId(field.error).textContent = message;
  input.classList.toggle("invalid", message !== "");
  return message === "";
}

function showTitleWarning() {
  byId("title-warning").textContent = checkDuplicateWord(byId("task-title").value);
}

// live feedback while typing
fields.forEach(function (field) {
  byId(field.input).addEventListener("input", function () {
    validateField(field);
    if (field.input === "task-title") {
      showTitleWarning();
    }
  });
});

function clearForm() {
  byId("task-form").reset();
  byId("task-id").value = "";
  byId("form-title").textContent = "Add a task";
  byId("save-btn").textContent = "Save task";
  fields.forEach(function (field) {
    byId(field.error).textContent = "";
    byId(field.input).classList.remove("invalid");
  });
  byId("title-warning").textContent = "";
}

byId("task-form").addEventListener("submit", function (event) {
  event.preventDefault();

  // check every field (no short-circuit, so every error shows)
  let allGood = true;
  fields.forEach(function (field) {
    if (!validateField(field)) {
      allGood = false;
    }
  });
  if (!allGood) {
    byId("form-status").textContent = "Please fix the errors above.";
    return;
  }

  const settings = getSettings();
  const data = {
    title: byId("task-title").value,
    dueDate: byId("task-date").value,
    duration: inputToMinutes(byId("task-duration").value, settings.unit),
    tag: byId("task-tag").value
  };

  const id = byId("task-id").value;
  if (id === "") {
    addTask(data);
    announce("Task added.");
  } else {
    updateTask(id, data);
    announce("Task updated.");
  }

  // remember a brand-new tag so it shows up in the list
  if (!settings.tags.includes(data.tag)) {
    updateSettings({ tags: settings.tags.concat(data.tag) });
  }

  clearForm();
  byId("form-status").textContent = "";
  refresh();
  window.location.hash = "#records";
});

byId("cancel-btn").addEventListener("click", function () {
  clearForm();
  window.location.hash = "#records";
});


//---search and sort---
byId("search-input").addEventListener("input", refresh);
byId("search-case").addEventListener("change", refresh);
byId("sort-select").addEventListener("change", refresh);
byId("search-form").addEventListener("submit", function(event) {
    event.preventDefault();
});


// ---------- edit and delete buttons in the table ----------
let idToDelete = null;
const dialog = byId("confirm-dialog");

byId("records-body").addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const id = button.getAttribute("data-id");
  const action = button.getAttribute("data-action");
  const task = getTaskById(id);
  if (!task) {
    return;
  }

  if (action === "edit") {
    clearForm();
    byId("task-id").value = task.id;
    byId("task-title").value = task.title;
    byId("task-date").value = task.dueDate;
    byId("task-duration").value = minutesToInput(task.duration, getSettings().unit);
    byId("task-tag").value = task.tag;
    byId("form-title").textContent = "Edit task";
    byId("save-btn").textContent = "Save changes";
    window.location.hash = "#form";
  }

  if (action === "delete") {
    idToDelete = id;
    byId("confirm-text").textContent = 'Delete "' + task.title + '"? This cannot be undone.';
    dialog.showModal();
  }
});

dialog.addEventListener("close", function () {
  if (dialog.returnValue === "delete" && idToDelete !== null) {
    deleteTask(idToDelete);
    announce("Task deleted.");
    refresh();
  }
  idToDelete = null;
});

// ---------- settings ----------
function fillSettingsForm() {
  const settings = getSettings();
  byId("setting-name").value = settings.name;
  byId("unit-" + settings.unit).checked = true;
  byId("setting-cap").value = String(Math.round((settings.weeklyCapMinutes / 60) * 100) / 100);
}

byId("settings-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const capText = byId("setting-cap").value;
  const capError = byId("cap-error");

  if (!patterns.duration.test(capText) || Number(capText) === 0) {
    capError.textContent = "Enter the cap in hours, like 20 or 12.5.";
    return;
  }
  capError.textContent = "";

  updateSettings({
    name: byId("setting-name").value.trim(),
    unit: document.querySelector('input[name="unit"]:checked').value,
    weeklyCapMinutes: Math.round(Number(capText) * 60)
  });
  byId("settings-status").textContent = "Settings saved.";
  announce("Settings saved.");
  refresh();
});

// add a tag
byId("add-tag-btn").addEventListener("click", function () {
  const value = byId("new-tag").value;
  const message = checkTag(value);
  byId("new-tag-error").textContent = message;
  if (message !== "") {
    return;
  }
  const tags = getSettings().tags;
  if (tags.includes(value)) {
    byId("new-tag-error").textContent = "That tag already exists.";
    return;
  }
  updateSettings({ tags: tags.concat(value) });
  byId("new-tag").value = "";
  refresh();
});

// remove a tag (tasks that already use it keep it)
byId("tag-list").addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  const tag = button.getAttribute("data-tag");
  updateSettings({ tags: getSettings().tags.filter(function (t) { return t !== tag; }) });
  refresh();
});

// ---------- export and import ----------
byId("export-btn").addEventListener("click", function () {
  const text = JSON.stringify(getTasks(), null, 2);
  const blob = new Blob([text], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "campus-living-tasks.json";
  link.click();
  URL.revokeObjectURL(link.href);
  byId("import-status").textContent = "Exported " + getTasks().length + " tasks.";
});

byId("import-file").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    const result = parseImport(reader.result);
    if (result.error !== "") {
      byId("import-status").textContent = "Import failed. " + result.error;
      return;
    }
    replaceTasks(result.tasks);
    byId("import-status").textContent = "Imported " + result.tasks.length + " tasks.";
    announce("Tasks imported.");
    refresh();
  };
  reader.onerror = function () {
    byId("import-status").textContent = "Could not read that file.";
  };
  reader.readAsText(file);
  event.target.value = "";   // lets me pick the same file again later
});

// ---------- start ----------
fillSettingsForm();
refresh();
goToPage();