/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  "testEnvironment": "jsdom",
  "transform": {
    "\\.[jt]sx?$": 'babel-jest',
    "node_modules/.*konva.*/": "babel-jest",
  },
  "moduleNameMapper": {
    "^konva": "konva/konva",
    "^react-konva-utils": "identity-obj-proxy",
    "\\.(s[ac]ss|css|styl|svg|png|jpe?g)$": "identity-obj-proxy",
  },
};
