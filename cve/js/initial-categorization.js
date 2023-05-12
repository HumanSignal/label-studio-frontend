import {lineCategories, fileCategories} from "./categories.js";
import {selectDropDownListValue} from "./d2h-hook/file-side-view-panel.js";

function ensureCategoryExists(type, categories, category)
{
    if(!categories.find(cat => cat.name === category))
        throw new Error(`Invalid ${type} category: "${category}". Must be one of: [${categories.map(cat => `"${cat.name}"`).join(", ")}]`)
}

function setInitialCategories(ratedFile, categorizedFile)
{
    let fileCategory = categorizedFile.category;

    ensureCategoryExists("file", fileCategories, fileCategory);

    selectDropDownListValue(ratedFile.dropDownList, fileCategory);

    [ratedFile.ratedLinesBeforeChange, ratedFile.ratedLinesAfterChange]
    .forEach((ratedLines, i) =>
    {
        // 0 = left panel = before change = false
        // 1 = right panel = after change = true
        let afterChange = Boolean(i);
        
        let categorizedLines = categorizedFile.lines;

        // find the corresponding categorized lines
        categorizedLines = afterChange ? categorizedLines.afterChange : categorizedLines.beforeChange;

        ratedLines.forEach(ratedLine =>
        {
            let lineNumber = ratedLine.lineNumber;

            // find the corresponding categorized line (by its line number)
            let categorizedLine = categorizedLines.find(categorizedLine => categorizedLine.lineNumber === lineNumber);

            if(!categorizedLine)
                throw new Error(`No category for line {file: "${categorizedFile.fileName}", line number: ${lineNumber}, "${afterChange ? "after" : "before"}Change"}`);
            
            let lineCategory = categorizedLine.category;

            ensureCategoryExists("line", lineCategories, lineCategory);

            selectDropDownListValue(ratedLine.dropDownList, lineCategory);
        });
    });
}

export {
    setInitialCategories
};