class FileCategory
{
    constructor(name, color)
    {
        this.name = name;
        this.color = color;
    }
}

const FILE_CATEGORY_CLASS_NAME_PREFIX = `file-category-`;

const getFileCategoryClassName = fileCategoryName => FILE_CATEGORY_CLASS_NAME_PREFIX + fileCategoryName;

function createFileCategoryCssClasses(fileCategories)
{
    let style = document.createElement("style");

    fileCategories.forEach(fileCategory =>
    {
        style.innerHTML +=
        `
        .${getFileCategoryClassName(fileCategory.name)}
        {
            color: ${fileCategory.color};
        }
        `;
    });

    document.head.appendChild(style);
}

function createFileCategories(namesColorsArray)
{
    let categories = namesColorsArray.map(([name, color]) => new FileCategory(name, color));
    
    createFileCategoryCssClasses(categories);
    
    return categories;
}

export {
    createFileCategories,
    getFileCategoryClassName
};