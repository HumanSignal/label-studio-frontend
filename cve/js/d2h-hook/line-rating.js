import {lineCategories} from "../categories.js";
import {getLineCategoryClassName} from "./line-category.js";

class RatedLine
{
    constructor(lineNumber, dropDownList)
    {
        this.lineNumber = lineNumber;
        this.dropDownList = dropDownList;
    }
}

function createLineRatingDropDownList()
{
    let dropDownList = document.createElement("select");

    dropDownList.classList.add("git-diff-gui-item", "line-rating");

    // make options for the list
    lineCategories.forEach(lineCategory =>
    {
        let option = document.createElement("option");

        option.value = lineCategory.name;
        option.innerText = lineCategory.getAbbreviation();
        option.className = getLineCategoryClassName(lineCategory.name);

        dropDownList.appendChild(option);
    });

    return dropDownList;
}

function createLineRatingLegendElement()
{
    let legend = document.createElement("select");

    legend.classList.add("git-diff-gui-item", "line-rating-legend");

    function createLegendOption(text)
    {
        let option = document.createElement("option");

        // make it read-only (disable selecting options)
        option.disabled = true;
        option.innerText = text;
        
        return option;
    }

    function createLegendLineCategoryOption(lineCategory)
    {
        let option = createLegendOption(`${lineCategory.abbreviation} ➔ ${lineCategory.name}`);
        
        option.className = getLineCategoryClassName(lineCategory.name);

        return option
    }

    let header = createLegendOption("Legend");
    // make the header not appear in the option list
    header.hidden = true;
    // select the header (otherwise the first
    // element in the list is selected)
    header.selected = true;

    legend.appendChild(header);

    lineCategories
    // skip categories where there's no abbreviation
    .filter(lineCategory => lineCategory.abbreviation)
    .forEach(lineCategory => legend.appendChild(createLegendLineCategoryOption(lineCategory)));

    return legend;
}

export {
    RatedLine,
    createLineRatingDropDownList,
    createLineRatingLegendElement
};