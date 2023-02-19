import { BaseConfig } from '@men-mvc/core';

interface AppConfig extends BaseConfig {
  /**
   * here you can add more config variables
   */
}

declare module 'config' {
  interface Config {
    // This method accepts only first-level keys of our IConfigApp interface (e.g. 'cat').
    // TypeScript compiler is going to fail for anything else.
    get: <T extends keyof AppConfig>(key: T) => AppConfig[T];
  }
}
