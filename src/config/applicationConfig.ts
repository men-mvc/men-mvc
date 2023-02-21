import { BaseConfig, Config } from '@men-mvc/core';

/**
 * You can prop/ type declaration your own config/ environment variables inside this class.
 * When you add a new config variable into a json file in {projectRoot}/config folder, you should
 * add a prop for that variable in this type variable declaring a type for your variable.
 */
type CustomConfig = {
  app: {
    feUrl: string;
  };
  database: {
    mongo: {
      uri: string;
    };
  };
};

type ApplicationConfig = CustomConfig & BaseConfig;

export const config: ApplicationConfig = {
  ...Config.getConfig<ApplicationConfig>()
};
