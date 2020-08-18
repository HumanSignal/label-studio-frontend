export default {
  DONE: "Done!",
  NO_COMP_LEFT: "No more completions",
  NO_NEXT_TASK: "No more data available for labeling",
  NO_ACCESS: "You don't have access to this task",

  // Tree validation messages
  ERR_REQUIRED: ({ modelName, field }) => {
    return `Attribute <b>${field}</b> is required for <b>${modelName}</b>`;
  },

  ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
    return `Tag with name <b>${value}</b> is not registered. Referenced by <b>${modelName}#${field}</b>.`;
  },

  ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
    return `Tag with name <b>${value}</b> does not exist in the config. Referenced by <b>${modelName}#${field}</b>.`;
  },

  ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
    return `Invalid attribute <b>${field}</b> for <b>${modelName}</b>: referenced tag is <b>${value}</b>, but <b>${modelName}</b> can only control <b>${[]
      .concat(validType)
      .join(", ")}</b>`;
  },

  ERR_BAD_TYPE: ({ modelName, field, validType }) => {
    return `Attribute <b>${field}</b> of tag <b>${modelName}</b> has invalid type. Valid types are: <b>${validType}</b>.`;
  },
};
