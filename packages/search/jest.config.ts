import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^database$": "<rootDir>/../database/src",
    "^types$": "<rootDir>/../types/src",
  },
};

export default config;
