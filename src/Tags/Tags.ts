import * as Tags from './AllTags';

/**
 * Mapping of all available tag controllers
 */
export type TagControllers = typeof Tags;

/**
 * List of all available controller names
 */
export type TagControllerName = keyof TagControllers;

/**
 * All available controllers
 */
export type TagController = TagControllers[TagControllerName];


/**
 * All available tags
 */
export { Tags };
