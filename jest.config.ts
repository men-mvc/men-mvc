import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  preset: '@shelf/jest-mongodb',
  coveragePathIgnorePatterns: ['node_modules', '<rootDir>/tests']
};
export default config;
