class LineCategory
{
    constructor(name, color, abbreviation = null)
    {
        this.name = name;
        this.color = color;
        this.abbreviation = abbreviation;
    }

    getAbbreviation()
    {
        return this.abbreviation || this.name;
    }
}

function makeLineCategory(name, color)
{
    let abbreviation = null;

    if(Array.isArray(name))
        [name, abbreviation] = name;

    return new LineCategory(name, color, abbreviation);
}

const LINE_CATEGORY_CLASS_NAME_PREFIX = `line-category-`;

const getLineCategoryClassName = lineCategoryName => LINE_CATEGORY_CLASS_NAME_PREFIX + lineCategoryName;

function createLineCategoryCssClasses(lineCategories)
{
    let style = document.createElement("style");

    lineCategories.forEach(lineCategory =>
    {
        style.innerHTML +=
        `
        .${getLineCategoryClassName(lineCategory.name)}
        {
            color: ${lineCategory.color};
        }
        `;
    });

    document.head.appendChild(style);
}

function createLineCategories(namesColorsArray)
{
    let categories = namesColorsArray.map(([name, color]) => makeLineCategory(name, color));

    createLineCategoryCssClasses(categories);

    return categories;
}

export {
    createLineCategories,
    getLineCategoryClassName
};