// state.js
// This file holds the list of tasks and the settings while the app is open.
// Every change goes through a function here, and each one saves to storage.

import { loadTasks, saveTasks, loadSettings, saveSettings } from "./storage.js";

// the current data. I load it once when the app starts.
let tasks = loadTasks();
let settings = loadSettings();


// ---------- reading ----------

export function getTasks() {
  return tasks;
}

export function getSettings() {
  return settings;
}

export function getTaskById(id) {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === id) {
      return tasks[i];
    }
  }
  return null;   // not found
}

//---making an id----
//Ids look like rec_0001, rec_0002...
//I find the biggest number already used and add 1
//so a deleted id is never reused by mistake.

function makeId() {
    let biggest = 0;
    for (let i = 0; i < tasks.length; i++) {
        const number = Number(tasks[i].id.replace("rec_", ""))
        if (number > biggest) {
            biggest = number;
        }
    }
    const next = String(biggest + 1).padStart(4, "0");
    return "rec_" + next;
}


// ---------- changing tasks ----------

// "data" has title, dueDate, duration (in minutes) and tag
export function addTask(data) {
  const now = new Date().toISOString();
  const newTask = {
    id: makeId(),
    title: data.title,
    dueDate: data.dueDate,
    duration: data.duration,
    tag: data.tag,
    createdAt: now,
    updatedAt: now
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id, data) {
  const task = getTaskById(id);
  if (task === null) {
    return null;
  }
  task.title = data.title;
  task.dueDate = data.dueDate;
  task.duration = data.duration;
  task.tag = data.tag;
  task.updatedAt = new Date().toISOString();   // only this changes, createdAt stays
  saveTasks(tasks);
  return task;
}


export function deleteTask(id) {
    const before = tasks.length;
    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });
    saveTasks(tasks);
    return tasks.length < before; //true if something was removed
}

//used by JSON import: replaces everything with the imported list
export function replaceTasks(newTasks) {
    tasks = newTasks;
    saveTasks(tasks);
}

//----settings----
export function updateSettings(changes) {
    settings = {...settings, ...changes};
    saveSettings(settings);
    return settings;
}

//----sorting----
//Returns a NEW sorted list. The original list stays in its saved order.
// "how" is one of the values from the sort dropdown, like "date-asc".

export function sortTasks(list, how) {
    const copy = list.slice();

    copy.sort(function(a, b) {
        if (how === "date-asc") {
            return a.dueDate.localeCompare(b.dueDate);
        }
        if (how === "date-desc") {
            return b.dueDate.localeCompare(a.dueDate);
        }
        if (how === "title-asc") {
            return a.title.localeCompare(b.title);
        }
        if (how === "title-desc") {
            return b.title.localeCompare(a.title);
        }
        if (how === "duration-asc") {
            return a.duration - b.duration;
        }
        if (how === "duration-desc") {
            return b.duration - a.duration;
        }
        return 0;
  });

  return copy;
}


// ---------- unit conversion ----------
// Durations are always SAVED in minutes. I only convert for display and typing.

export function minutesToText(minutes, unit) {
  if (unit === "hours") {
    const hours = Math.round((minutes / 60) * 100) / 100;   // 2 decimals at most
    return hours + " h";
  }
  return minutes + " min";
}

// what the user typed, in their chosen unit -> minutes
export function inputToMinutes(value, unit) {
  const number = Number(value);
  if (unit === "hours") {
    return Math.round(number * 60);
  }
  return number;
}

// minutes -> a plain number to show inside the form when editing
export function minutesToInput(minutes, unit) {
  if (unit === "hours") {
    return String(Math.round((minutes / 60) * 100) / 100);
  }
  return String(minutes);
    
}