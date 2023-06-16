/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/?(*.)+(spec|test).[jt]s"],
  testPathIgnorePatterns: ["dist", "node_modules"]
};
