import {createRatedFile, getFileName} from "./file-rating.js";

// one file wrapper for each file
const getFileWrappers = gitDiffContainer => Array.from(gitDiffContainer.getElementsByClassName("d2h-file-wrapper"));

// 2 tables
const getSideViewTables = fileWrapper => Array.from(fileWrapper.getElementsByClassName("d2h-diff-table"));

const getFirstCells = table => Array.from(table.tBodies[0].rows).map(row => row.cells[0]);

const createRatedFiles = (gitDiffContainer, categorizedFiles) => getFileWrappers(gitDiffContainer).map(fileWrapper =>
{
    let fileName = getFileName(fileWrapper);

    // 2d array: array of first <td> elements for 2 side panels
    let cellsForPanels = getSideViewTables(fileWrapper).map(getFirstCells);

    // find the corresponding categorized file (by its file name)
    let categorizedFile = categorizedFiles.find(categorizedFile => categorizedFile.fileName === fileName);

    if(!categorizedFile)
        throw new Error(`No categorization data for file "${fileName}"`);

    return createRatedFile(fileWrapper, cellsForPanels, categorizedFile);
});

export {
    createRatedFiles
};