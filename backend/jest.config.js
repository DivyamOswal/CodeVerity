export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.js"],
  testTimeout: 20000,
  modulePathIgnorePatterns: ["<rootDir>/temp/"],
  watchPathIgnorePatterns: ["<rootDir>/temp/"],
};