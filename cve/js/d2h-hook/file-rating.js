import {fileCategories} from "../categories.js";
import {createRatedLines} from "./file-side-view-panel.js";
import {getFileCategoryClassName} from "./file-category.js";
import {createLineRatingLegendElement} from "./line-rating.js";
import {setInitialCategories} from "../initial-categorization.js";
import {createSelectMultipleLineRatingDropDownListsHelpers} from "./file-panel.js";

class RatedFile
{
    constructor(fileName, dropDownList, ratedLinesBeforeChange, ratedLinesAfterChange)
    {
        this.fileName = fileName;

        this.dropDownList = dropDownList;

        this.ratedLinesAfterChange = ratedLinesAfterChange;
        this.ratedLinesBeforeChange = ratedLinesBeforeChange;
    }

    getAllRatedLines()
    {
        return this.ratedLinesBeforeChange.concat(this.ratedLinesAfterChange);
    }
}

function createFileRatingDropDownList()
{
    let dropDownList = document.createElement("select");

    dropDownList.classList.add("git-diff-gui-item", "file-rating");

    let lastSelectedOptionClassName = null;

    // set color based on currently selected category
    dropDownList.onchange = () =>
    {
        dropDownList.classList.remove(lastSelectedOptionClassName);

        lastSelectedOptionClassName = getFileCategoryClassName(dropDownList.value);

        dropDownList.classList.add(lastSelectedOptionClassName);
    }

    // make options for the list
    fileCategories.forEach(fileCategory =>
    {
        let option = document.createElement("option");

        option.value = fileCategory.name;
        option.innerText = fileCategory.name;
        option.className = getFileCategoryClassName(fileCategory.name);

        dropDownList.appendChild(option);
    });

    return dropDownList;
}

const getFileName = fileWrapper => fileWrapper.getElementsByClassName("d2h-file-name")[0].innerText;

const getFileNameWrapper = fileWrapper => fileWrapper.getElementsByClassName("d2h-file-name-wrapper")[0];

function createFileRatingDropDownListContainer(dropDownList)
{
    let container = document.createElement("div");

    container.className = "git-diff-gui-item";

    container.style =
    `
        margin-left: auto;
        margin-right: 0.3em;

        padding-left: 0.3em;
        padding-right: 0.3em;
    `;
    
    container.appendChild(document.createTextNode("File:"))
    container.appendChild(dropDownList);

    return container;
}

function createRatedFile(fileWrapper, cellsForPanels, categorizedFile)
{
    let fileName = getFileName(fileWrapper);

    let fileRatingDropDownList = createFileRatingDropDownList();

    // add rated lines for the file for before and after the git change
    let ratedLinesForPanels = cellsForPanels.map(createRatedLines);

    let ratedFile = new RatedFile(fileName, fileRatingDropDownList, ...ratedLinesForPanels);

    // set initial category before creating selecting helpers
    setInitialCategories(ratedFile, categorizedFile);

    let rightContainer = document.createElement("div");
    // move it to the right
    rightContainer.style =
    `
        display: flex;
        align-items: center;

        margin-left: auto;
    `;

    let fileNameWrapper = getFileNameWrapper(fileWrapper);

    // add all helpers (hunk checkboxes + drop-down lists to select all lines in a side view panel)
    createSelectMultipleLineRatingDropDownListsHelpers(ratedFile, [fileNameWrapper, rightContainer]);

    // append the file rating drop-down list container
    // after a possible helper for left side panel ("All -")
    // was created
    fileNameWrapper.appendChild(createFileRatingDropDownListContainer(fileRatingDropDownList));

    // add line rating legend
    rightContainer.appendChild(createLineRatingLegendElement());

    // append the container after appending checkbox for left panel
    // (otherwise the checkbox gets appended after the container)
    fileNameWrapper.appendChild(rightContainer);

    return ratedFile;
}

export {
    getFileName,
    createRatedFile
};