import nanoid from "nanoid";

/**
 * Unique hash generator
 * @param {number} lgth
 */
export const guidGenerator = (length = 10) => nanoid(length);
