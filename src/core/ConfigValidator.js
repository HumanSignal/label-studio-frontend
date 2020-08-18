import Registry from "./Registry";
import { types } from "mobx-state-tree";

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

const ValidType = types.union(types.string, types.array(types.string));

export const ValidationError = types.model({
  modelName: types.string,
  field: types.string,
  error: types.string,
  value: types.maybeNull(types.string),
  validType: types.maybeNull(ValidType),
});

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
 * Validates precense and format of name attribute
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

  if (!controlledTags) return null;

  // Collect available tag names
  const controlledTagTypes = controlledTags
    .getSubTypes()[0]
    .getSubTypes()
    .map(stype => stype.value);

  // Check if controlled tags are actually registered
  const notRegisteredTags = controlledTagTypes.reduce((res, value) => {
    try {
      Registry.getModelByTag(value.toLowerCase());
    } catch {
      res.push(errorBuilder.unknownTag(model.name, "toname", value));
    }
    return res;
  }, []);

  if (notRegisteredTags.length) return notRegisteredTags[0];

  // Find referenced tag in the tree
  const controlledTag = flatTree.find(item => item.name === element.toname);

  if (controlledTag === undefined) {
    return errorBuilder.tagNotFound(model.name, "toname", element.toname);
  }

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
    if (key in fieldsToSkip) continue;
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
  if (!type) return null;

  try {
    let types = [].concat(...(type.getSubTypes?.() ?? []).map(t => t.getSubTypes?.() ?? t));

    return types.filter(type => type.name !== "null").map(type => JSON.parse(type.name));
  } catch {
    return type.name;
  }
};

/**
 * Validate node attributes and compatibility with other nodes
 * @param {*} node
 */
export const validateConfigTree = root => {
  const flatTree = flattenTree(root);
  const fieldsToSkip = ["id", "children", "name", "toname", "controlledTags"];
  const validationResult = [];

  for (let child of flatTree) {
    const model = Registry.getModelByTag(child.type);
    // Validate name attribute
    const nameValidation = validateNameTag(child, model);
    if (nameValidation !== null) validationResult.push(nameValidation);

    // Validate toName attribute
    const toNameValidation = validateToNameTag(child, model, flatTree);
    if (toNameValidation !== null) validationResult.push(toNameValidation);

    validationResult.push(...validateAttributes(child, model, fieldsToSkip));
  }

  if (validationResult.length) {
    return validationResult.map(error => {
      const compiledError = { ...error, validType: humanizeTypeName(error.validType) };
      try {
        return ValidationError.create(compiledError);
      } catch (err) {
        console.log({ compiledError });
        throw err;
      }
    });
  }

  return null;
};
