//storage.is
//This file only talks to localStorage.
//It does not know anything about the page or the buttons.

// the names I save my data under in the browser
const TASKS_KEY = "campusliving:tasks";
const SETTINGS_KEY = "campusliving:settings";

//what the settings look like the first time someone opens the app
export const defaultSettings = {
    name: "",
    unit: "minutes",  //show durations in "minutes" or "hours"
    weeklyCapMinutes: 1200, //20 hours
    tags: ["study", "Club", "Assignment", "Social", "Exam", "Other"]
};

// ---------- tasks ----------

export function loadTasks() {
  try {
    const saved = localStorage.getItem(TASKS_KEY);
    if (saved === null) {
      return [];   // nothing saved yet
    }
    const tasks = JSON.parse(saved);
    // make sure it is really a list, in case something else wrote here
    if (Array.isArray(tasks)) {
      return tasks;
    }
    return [];
  } catch (error) {
    //if the saved text is broken, start with an empty list instead of crashing
    console.error("Could not load tasks:", error);
    return [];
  }
}

export function saveTasks(tasks) {
    try {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
    }
}

// ---------- settings ----------

export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved === null) {
      return { ...defaultSettings };
    }
    // mix saved settings on top of the defaults,
    // so a missing setting still gets a value
    return { ...defaultSettings, ...JSON.parse(saved) };
  } catch (error) {
    console.error("Could not load settings:", error);
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Could not save settings:", error);
    }
}

// ---------- checking imported JSON ----------
// Returns "" if the record looks right, or a message saying what is wrong.

export function checkRecordShape(record, position) {
  const label = "Record " + (position + 1) + ": ";

  if (typeof record !== "object" || record === null) {
    return label + "is not an object.";
  }
  if (typeof record.id !== "string" || record.id === "") {
    return label + "needs an id.";
  }
  if (typeof record.title !== "string" || record.title === "") {
    return label + "needs a title.";
  }
  if (typeof record.dueDate !== "string") {
    return label + "needs a dueDate.";
  }
  if (typeof record.duration !== "number" || record.duration <= 0) {
    return label+ "needs a duration in minutes(a number above 0).";
  }
  if (typeof record.tag !== "string" || record.tag === "") {
    return label + "needs a tag.";
  }
  if (typeof record.createdAt !== "string" || typeof record.updatedAt !== "string") {
    return label + "needs createdAt and updatedAt.";
  }
  return "";
}

// Takes the text from a JSON file.
// Returns { tasks: [...], error: "" } when it is fine,
// or { tasks: [], error: "message" } when it is not.
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { tasks: [], error: "That file is not valid JSON." };
  }

  if (!Array.isArray(data)) {
    return { tasks: [], error: "The file must contain a list of tasks." };
  }

  for (let i = 0; i < data.length; i++) {
    const problem = checkRecordShape(data[i], i);
    if (problem !== "") {
        return {tasks: [], error: problem};
    }
  }
  return {tasks: data, error: ""};
}
