//search.js
//This file turns what the user typed in the search box into a filtered list

export function compileRegex(input, flags) {
    try {
        return input ? new RegExp(input, flags) : null;
    } catch (error) {
        return null;
    }
}

//Returns {list, regex, error}
export function filterTasks(tasks, query, ignoreCase) {
    const flags = ignoreCase ? "i" : "";
    let text = query.trim();

    if (text === "") {
        return {list: tasks, regex: null, error: false};
    }

    let list = tasks;

    //special syntax: @tag:exam filters by tag first
    const tagMatch = text.match(/^@tag:(\w+)\s*(.*)$/i);
    if (tagMatch) {
        const wanted = tagMatch[1].toLowerCase();
        list = list.filter(function(task){
            return task.tag.toLowerCase() === wanted;
        });
        text = tagMatch[2];
        if (text === "") {
            return {list: list, regex: null, error: false };
        }
    }

    const regex = compileRegex(text, flags);
    if (regex === null) {
        return {list: [], regex: null, error: true};
    }

    const found = list.filter(function(task){
        return (
            regex.test(task.title) ||
            regex.test(task.tag) ||
            regex.test(task.dueDate)
        );
    });
    return {list: found, regex: regex, error: false};
}