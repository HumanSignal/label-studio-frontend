/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import * as Examples from './examples';

/**
 * Custom Data
 */
// import { AllTypes } from "../examples/all_types";

const example = Examples.RichTextHtml;

/**
 * Get current config
 * @param {string} pathToConfig
 */
async function getConfig(pathToConfig: string) {
  const response = await fetch(pathToConfig);
  const config = await response.text();

  return config;
}

/**
 * Get custom config
 */
async function getExample() {
  const datatype = example;

  const config = await getConfig(datatype.config);
  const tasks = datatype.tasks ?? [];
  const annotations = (datatype.annotation?.annotations) ?? [];
  const predictions = (tasks[0]?.predictions) ?? [];

  const task = {
    id: Math.random(),
    annotations,
    predictions,
    data: JSON.stringify(tasks[0]?.data ?? ''),
  };

  return { config, task, annotations, predictions };
}

export { configureApplication, getData, rootElement } from './common';
export { getExample };
export const name = 'development';
