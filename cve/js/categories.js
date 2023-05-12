import {createFileCategories} from "./d2h-hook/file-category.js";
import {createLineCategories} from "./d2h-hook/line-category.js";

let lineCategories = 
[
    [["Bugfix",         "Fix"],  "red"],
    [["Infrastructure", "Infr"], "yellow"],
    ["Test",                     "lightskyblue"],
    [["Comment",        "Com"],  "lime"],
    [["Documentation",  "Doc"],  "orange"],
    [["Other",          "Oth"],  "orchid"]
];

let fileCategories =
[
    ["Code",          "red"],
    ["Documentation", "orange"],
    ["Test",          "lightskyblue"],
    ["Other",         "orchid"]
];

function createCategories()
{
    fileCategories = createFileCategories(fileCategories);
    lineCategories = createLineCategories(lineCategories);
}

export {
    fileCategories,
    lineCategories,
    createCategories
};