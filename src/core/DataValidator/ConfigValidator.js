import Registry from "../Registry";

const errorBuilder = {
  /**
   * Occurrs when attribute is not provided at all
   */
  required(modelName, field) {
    return {
      modelName,
      field,
      error: "ERR_REQUIRED",
    };
  },

  /**
   * Occurrs when tag is not in our Registry
   */
  unknownTag(modelName, field, value) {
    return {
      modelName,
      field,
      value,
      error: "ERR_UNKNOWN_TAG",
    };
  },

  /**
   * Occurrs when tag is not on the tree
   */
  tagNotFound(modelName, field, value) {
    return {
      modelName,
      field,
      value,
      error: "ERR_TAG_NOT_FOUND",
    };
  },

  /**
   * Occurrs when referenced tag cannot be controlled by particular control tag
   */
  tagUnsupported(modelName, field, value, validType) {
    return {
      modelName,
      field,
      value,
      validType,
      error: "ERR_TAG_UNSUPPORTED",
    };
  },

  /**
   * Occurrs when attribute value has wrong type
   */
  badAttributeValueType(modelName, field, value, validType) {
    return {
      modelName,
      field,
      value,
      validType,
      error: "ERR_BAD_TYPE",
    };
  },
};

/**
 * Transforms MST `describe()` to a human-readable value
 * @param {import("mobx-state-tree").IType} type
 * @param {boolean} withNullType
 */
const getTypeDescription = (type, withNullType = true) => {
  let description = type
    .describe()
    .match(/([a-z0-9?|]+)/gi)
    .join("")
    .split("|");

  // Remove optional null
  if (withNullType === false) {
    const index = description.indexOf("null?");
    if (index >= 0) description.splice(index, 1);
  }

  return description;
};

/**
 * Flatten config tree for faster iterations and searches
 * @param {object} tree
 * @param {string} parent
 * @returns {object[]}
 */
const flattenTree = (tree, parent = null) => {
  const result = [];

  for (let child of tree.children) {
    /* Create a child without children and
    assign id of the parent for quick mathcing */
    const flatChild = { ...child, parent: parent?.id ?? null };
    delete flatChild.children;

    result.push(flatChild);

    /* Recursively add children if exist */
    if (child.children instanceof Array) {
      result.push(...flattenTree(child, child));
    }
  }

  return result;
};

/**
 * Validates presence and format of the name attribute
 * @param {Object} child
 * @param {Object} model
 */
const validateNameTag = (child, model) => {
  const { name } = model.properties;

  if (name && child.name === undefined) {
    return errorBuilder.required(model.name, "name");
  }

  return null;
};

/**
 * Validates toName attribute
 * Checks that connected tag is existing tag, it present in the tree
 * and can be controlled by current Object Tag
 * @param {Object} element
 * @param {Object} model
 * @param {Object[]} flatTree
 */
const validateToNameTag = (element, model, flatTree) => {
  const { toname, controlledTags } = model.properties;

  if (toname && element.toname === undefined) {
    return errorBuilder.required(model.name, "toname");
  }

  // Find referenced tag in the tree
  const controlledTag = flatTree.find(item => item.name === element.toname);

  if (controlledTag === undefined) {
    return errorBuilder.tagNotFound(model.name, "toname", element.toname);
  }

  if (!controlledTags) return null;

  if (controlledTags.validate(controlledTag.tagName).length > 0) {
    return errorBuilder.tagUnsupported(model.name, "toname", controlledTag.tagName, controlledTags);
  }

  return null;
};

/**
 * Validate other tag attributes other than name and toName
 * @param {Object} child
 * @param {import("mobx-state-tree").IModelType} model
 * @param {string[]} fieldsToSkip
 */
const validateAttributes = (child, model, fieldsToSkip) => {
  const result = [];
  const properties = Object.keys(model.properties);

  for (let key of properties) {
    if (!child.hasOwnProperty(key)) continue;
    if (fieldsToSkip.includes(key)) continue;
    const value = child[key];
    const modelProperty = model.properties[key.toLowerCase()];
    const mstValidationResult = modelProperty.validate(value, modelProperty);

    if (mstValidationResult.length === 0) continue;

    result.push(errorBuilder.badAttributeValueType(model.name, key, value, modelProperty));
  }

  return result;
};

/**
 * Convert MST type to a human-readable string
 * @param {import("mobx-state-tree").IType} type
 */
const humanizeTypeName = type => {
  return type ? getTypeDescription(type, false) : null;
};

export class ConfigValidator {
  /**
   * Validate node attributes and compatibility with other nodes
   * @param {*} node
   */
  static validate(root) {
    const flatTree = flattenTree(root);
    const propertiesToSkip = ["id", "children", "name", "toname", "controlledTags"];
    const validationResult = [];

    for (let child of flatTree) {
      const model = Registry.getModelByTag(child.type);
      // Validate name attribute
      const nameValidation = validateNameTag(child, model);
      if (nameValidation !== null) validationResult.push(nameValidation);

      // Validate toName attribute
      const toNameValidation = validateToNameTag(child, model, flatTree);
      if (toNameValidation !== null) validationResult.push(toNameValidation);

      validationResult.push(...validateAttributes(child, model, propertiesToSkip));
    }

    if (validationResult.length) {
      return validationResult.map(error => ({
        ...error,
        validType: humanizeTypeName(error.validType),
      }));
    }

    return [];
  }
}
