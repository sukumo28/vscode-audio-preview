module.exports = {
  automock: false,
  rootDir: "src",
  testEnvironment: "jsdom",
  setupFiles: ["jest-canvas-mock"],
  moduleNameMapper: {
    "\\.css$": "<rootDir>/__mocks__/styleMock.js",
  },
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
};
