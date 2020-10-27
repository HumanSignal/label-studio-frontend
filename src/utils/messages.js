/* eslint-disable react/jsx-no-target-blank */

import React from "react";

const URL_CORS_DOCS = "https://app.heartex.ai/docs/guide/FAQ.html#Image-audio-resource-loading-error-while-labeling";

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

  ERR_INTERNAL: ({ value }) => {
    return `Internal error. See browser console for more info. Try again or contact developers.<br/>${value}`;
  },

  ERR_GENERAL: ({ value }) => {
    return value;
  },

  // Object loading errors
  URL_CORS_DOCS,

  ERR_LOADING_AUDIO: ({ attr, url, error }) => (
    <p>
      Error while loading audio. Check <code>{attr}</code> field in task.
      <br />
      Technical description: {error}
      <br />
      URL: {url}
    </p>
  ),

  ERR_LOADING_S3: ({ attr, url, error }) => `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        The request parameters are invalid.
        If you are using S3, make sure you’ve specified the right bucket region name.
      </p>
      <p>URL: <code><a href=${url} target="_blank">${url}</a></code></p>
    </div>
  `,

  ERR_LOADING_CORS: ({ attr, url, error }) => `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        Most likely that's because static server has wide-open CORS.
        <a href=${URL_CORS_DOCS} target="_blank">Read more on that here.</a>
      </p>
      <p>
        Also check that:
        <ul>
          <li>URL is valid</li>
          <li>Network is reachable</li>
        </ul>
      </p>
      <p>URL: <code><a href=${url} target="_blank">${url}</a></code></p>
    </div>
  `,

  ERR_LOADING_HTTP: ({ attr, url, error }) => `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value
      </p>
      <p>
        Things to look out for:
        <ul>
          <li>URL is valid</li>
          <li>URL scheme matches the service scheme, i.e. https and https</li>
          <li>
            The static server has wide-open CORS,
            <a href=${URL_CORS_DOCS} target="_blank">more on that here</a>
          </li>
        </ul>
      </p>
      <p>
        Technical description: <code>${error}</code>
        <br />
        URL: <code><a href=${url} target="_blank">${url}</a></code>
      </p>
    </div>
  `,
};
