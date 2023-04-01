import type { Config } from '@jest/types';

// set the default timezone for the tests
process.env.TZ = 'GMT';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  preset: 'ts-jest',
  coveragePathIgnorePatterns: ['node_modules', '<rootDir>/tests'],
  setupFilesAfterEnv: ['jest-expect-message']
};
export default config;
