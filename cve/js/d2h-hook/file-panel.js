function createSelectMultipleLineRatingDropDownListsHelpers(ratedFile, allSelectorContainers)
{
    [ratedFile.ratedLinesBeforeChange, ratedFile.ratedLinesAfterChange]
    .forEach((ratedLines, i) =>
    {
        // skip side views where there are less than 2 lines (not necessarily grouped)
        // because it's the same situation as adding a checkbox for 1 standalone line
        // - selecting its drop-down list already means selecting "all" lists
        if(ratedLines.length < 2)
            return;
        
        // 0 - left panel - before change - false
        // 1 - rght panel - after change - true
        let afterChangePanel = Boolean(i);

        createSelectMultipleLineRatingDropDownListsHelpersForFileSideView(ratedLines, allSelectorContainers[i], afterChangePanel);
    });
}

export {
    createSelectMultipleLineRatingDropDownListsHelpers
};