//validators.js
//This file holds the rules that check what the user typed
//----the regex patterns----//
//I keep them in one object so I can list them in the README later.//
export const patterns = {
    // title: no space at the start or the end
    // ^\S means the first character is not a space
    // (?:.*\S)? means "anything, but it must end with a non-space" (optional)
    title: /^\S(?:.*\S)?$/,

    //duration: a whole number or a number with 1 or 2 decimals
    //0 is allowed here, but no leading zeros like 007
    duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,

    //date: YYYY-MM-DD with a valid month (01-12) and day (01-31)
    date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

    //tag: letters only, words can be joined with a space or a hyphen
    tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,

    // ADVANCED RULE (back-reference):
    // (\w+) catches a word, \s+ is the space, \1 means "the same word again"
    // so "study study" matches but "study hard" does not
    duplicateWord: /\b(\w+)\s+\1\b/i
};

//----helper: is this a real calendar date?----
//The date regex lets 2026-02-30 through, so I check the calendar too.
function isRealDate(text) {
    const parts = text.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    //new Date(year, month - 1, day) fixes bad day by rolling over to the next month.
    //So if the date I get back is different from what I typed, the date was not real
    const check = new Date(year, month - 1, day);

    return (
        check.getFullYear() === year &&
        check.getMonth() === month -1 &&
        check.getDate() === day
    );
}

//----the checking functions----
export function checkTitle(value) {
    if (value === "") {
        return "Please enter a title.";
    }
    if (!patterns.title.test(value)) {
        return "Remove the spaces at the start or the end of the title.";
    }
    return "";
}
//This one is a WARNING, not an error. The task can still be saved.
export function checkDuplicateWord(value) {
    const match = value.match(patterns.duplicateWord);
    if (match) {
        return 'The word "' + match[1] + '" appears twice in a row. Is that a typo?';
    }
    return "";
}

export function checkDate(value) {
    if (value === "") {
        return "Please enter a due date.";
    }
    if (!patterns.date.test(value)) {
        return "Use the format YYYY-MM-DD, for example 2026-10-20.";
    }
    if (!isRealDate(value)) {
        return "That date does not exist on the calendar.";
    }
    return "";
}

export function checkDuration(value) {
    if (value === "") {
        return "Please enter a duration.";
    }
    if (!patterns.duration.test(value)){
        return "Use a number like 90 or 1.5 (at most 2 decimals).";
    }
    if (Number(value) === 0) {
        return "Duration must be more than 0.";
    }
    return "";
}

export function checkTag(value) {
    if (value === "") {
        return "Please choose or type a tag.";
    }
    if (!patterns.tag.test(value)) {
        return "Tags can only use letters, with single spaces or hyphens between words."; 
    }
    return "";

}
        
    