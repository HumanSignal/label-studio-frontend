import {RatedLine} from "./line-rating.js";
import {getLineCategoryClassName} from "./line-category.js";
import {createLineRatingDropDownList} from "./line-rating.js";

// remove all children (it's just the line number)
const clearCell = cell => cell.innerHTML = "";

function setCellContent(cell, child)
{
    // first empty the cell
    clearCell(cell);

    // then append the child
    cell.appendChild(child);
}

function getCellTextElement(cell)
{
    let textElement = cell.nextElementSibling.firstElementChild;

    let child = textElement.firstElementChild;

    // block header ("d2h-info" class) doesn't have another child
    if(child)
        textElement = child;

    return textElement;
}

// adjust prefix position (for lines of code; for block header - shift the text)
// - move it to the right with padding
function padCellText(cell)
{
    let textElement = getCellTextElement(cell);

    // normal space (" ") doesn't work in block header so use the unicode character
    textElement.innerText = "\u00a0".repeat(3) + textElement.innerText;
}

// make the cell bigger to fit the drop-down list and line number
const setCellStyle = cell => cell.style.width = "5em";

function adjustCell(cell)
{
    setCellStyle(cell);

    padCellText(cell);
}

function createRatedLine(cell)
{
    let dropDownList = createLineRatingDropDownList();

    let style = dropDownList.style;

    // make it a little so that a Hunk (group of lines) is seen as a solid column
    style.paddingTop = style.paddingBottom = "5%";

    let lastSelectedOptionClassName = null;

    // set color based on currently selected category
    dropDownList.onchange = () =>
    {
        dropDownList.classList.remove(lastSelectedOptionClassName);

        lastSelectedOptionClassName = getLineCategoryClassName(dropDownList.value);

        dropDownList.classList.add(lastSelectedOptionClassName);

        cell.style.backgroundColor = window.getComputedStyle(dropDownList).color;
    }

    // get the line number before it's removed inside `setCellContent`
    let lineNumber = parseInt(cell.innerText);

    // needs to be appended before calling `select.onchange()`
    // because otherwise `window.getComputedStyle()` returns empty data
    setCellContent(cell, dropDownList);

    // adjust when set
    adjustCell(cell);

    return new RatedLine(lineNumber, dropDownList);
}

// "-" and "+" in git diff
const D2H_GIT_DIFF_CHANGE_CLASS_NAMES = ["d2h-del", "d2h-ins"];

// panelIndex is either 0 (left) or 1 (right)
function createRatedLines(cells, panelIndex)
{
    let ratedLines = [];

    let skippedCells = [];

    // left panel has "-" and right panel has "+"
    const gitDiffClassName = D2H_GIT_DIFF_CHANGE_CLASS_NAMES[panelIndex];

    // add the drop-down list if the line has been changed ("+" or "-" in git diff)
    cells.forEach(cell =>
    {
        // skip if not a changed line
        // (e.g. empty placeholder in the second panel in side-by-side view)
        if(!cell.classList.contains(gitDiffClassName))
        {
            skippedCells.push(cell);

            return;
        }

        ratedLines.push(createRatedLine(cell));
    });

    // adjust skipped cells if added at least one drop-down list
    if(ratedLines.length)
        skippedCells.forEach(adjustCell);

    return ratedLines;
}

function getLineRatingDropDownListGroups(ratedLines)
{
    let groups = [];

    let lastGroup = null;
    let lastLineNumber = null;

    function setGroup(ratedLine, isNewGroup = true)
    {
        lastLineNumber = ratedLine.lineNumber;

        let dropDownList = ratedLine.dropDownList;
        
        if(isNewGroup)
            lastGroup = [];
        
        lastGroup.push(dropDownList);
    }

    // copy the array because we'll be removing
    // the first element and it's passed
    // by reference to the function
    ratedLines = ratedLines.slice();

    // create first group consisting of the first list
    setGroup(ratedLines.shift());

    ratedLines.forEach(ratedLine =>
    {
        // if the line belongs to the group then add it to the group
        if(ratedLine.lineNumber - lastLineNumber === 1)
        {
            setGroup(ratedLine, false);

            return;
        }

        // if the line doesn't belong to the group and the group has
        // at least 2 elements then add the group to the list of groups
        // (there's no point in creating a group with only one
        // drop-down list - "all lists" is just the one then)
        if(lastGroup.length > 1)
            groups.push(lastGroup);
        
        // if the line doesn't belong to then group
        // then create a new one with it
        setGroup(ratedLine);
    });

    // if the loop ended with a group then add it here
    if(lastGroup.length > 1)
        groups.push(lastGroup);

    return groups;
}

function setSelectHunkCheckboxOnChangeHandler(checkbox, dropDownLists)
{
    let selectedValueForAll = null;

    let originalDropDownListsOnChangeHandlers = dropDownLists.map(dropDownList => dropDownList.onchange);

    const updateAllDropDownListsOnChange = () => dropDownLists.forEach((dropDownList, i) =>
    {
        // only change value and call the original handler
        // if the value has actually changed
        if(dropDownList.value === selectedValueForAll)
            return;
        
        dropDownList.value = selectedValueForAll;
        originalDropDownListsOnChangeHandlers[i]();
    });

    checkbox.onchange = () =>
    {
        // if checked then set new onchange handlers for drop-down lists
        // else replace the new handlers with original ones
        const original = !checkbox.checked;

        dropDownLists.forEach((dropDownList, i) =>
        {
            let originalHandler = originalDropDownListsOnChangeHandlers[i];

            let handler = original ? originalHandler : () =>
            {
                // call original `onchange()` handler here so that there's no
                // need to make additional checks in `updateAllDropDownListsOnChange`
                // (because we're skipping calling the original handler if `value` hasn't change
                // but then originator drop-down list's value is updated without the original
                // handler having been called)
                originalHandler();

                selectedValueForAll = dropDownList.value;

                updateAllDropDownListsOnChange();
            };

            dropDownList.onchange = handler;
        });
    };
}

function createSelectHunkCheckbox(parent, dropDownLists)
{
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    let label = document.createElement("label");
    
    label.className = "git-diff-gui-item";

    // add checkbox to the label this way instead of setting
    // `label.htmlFor = checkbox.id;`
    // because this way we can avoid unnecessarily specifying
    // an id for the checkbox
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode("Hunk"))

    label.style.fontSize = "1.25em";

    parent.style.backgroundColor = "black";

    setSelectHunkCheckboxOnChangeHandler(checkbox, dropDownLists);

    parent.appendChild(label);

    checkbox.checked = true;
    checkbox.onchange();
}

function selectDropDownListValue(dropDownList, value)
{
    dropDownList.value = value;
    dropDownList.onchange();
}

function createAllSelectorDropDownList(dropDownLists, afterChangePanel)
{
    let dropDownList = createLineRatingDropDownList();

    // reddish color for "-" panel
    // greenish color for "+" panel
    dropDownList.classList.add(`git-diff-${afterChangePanel ? "ins": "del"}`);

    let header = document.createElement("option");

    header.value = "header";

    header.innerText = `All ${afterChangePanel ? "+" : "-"}`;

    // make the header not appear in the option list
    header.hidden = true;
    // select the header (otherwise the first
    // element in the list is selected)
    header.selected = true;

    dropDownList.onchange = () =>
    {
        let value = dropDownList.value;

        // change value for all (if the value has actually changed)
        dropDownLists.forEach(dropDownList =>
        {
            if(dropDownList.value !== value)
                selectDropDownListValue(dropDownList, value);
        });

        // don't change the selected option so that it can be chosen again
        // and the header text stays visible
        dropDownList.value = header.value;
    };

    dropDownList.appendChild(header);

    let style = dropDownList.style;

    // without "float: left" the drop-down list is above legend element
    if(afterChangePanel)
        style.float = "left";

    style.paddingLeft = style.paddingRight = style.marginLeft = style.marginRight = "0.3em";

    return dropDownList;
}

const getPreviousCell = cell => cell.parentElement.previousElementSibling.firstElementChild;

function createSelectMultipleLineRatingDropDownListsHelpersForFileSideView(ratedLines, allSelectorContainer, afterChangePanel)
{
    let groups = getLineRatingDropDownListGroups(ratedLines);

    // create drop-down list for entire file side view
    //
    // if there's only 1 group that contains all the lines then adding
    // the select for entire file side view is redundant
    if(groups.length !== 1 || groups[0].length !== ratedLines.length)
    {
        let dropDownList = createAllSelectorDropDownList(ratedLines.map(ratedLine => ratedLine.dropDownList), afterChangePanel);

        allSelectorContainer.appendChild(dropDownList);
    }

    // create checkboxes for groups
    // after creating the drop-down list for entire file side view
    // (because checkboxes affect drop-down lists `onchange()` handlers)
    groups.forEach(group =>
    {
        // cell above the first (top) drop-down list in the group
        let previousCell = getPreviousCell(group[0].parentElement);

        // remove cell's content before `createSelectHunkCheckbox`
        // appends to it
        clearCell(previousCell);

        createSelectHunkCheckbox(previousCell, group);
    });
}

export {
    createRatedLines,
    selectDropDownListValue,
    createSelectMultipleLineRatingDropDownListsHelpersForFileSideView
};