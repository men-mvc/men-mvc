import { BaseApplication, setServerDirectory } from '@men-mvc/essentials';
import { express, Express } from '@men-mvc/essentials/lib/express';
import { Application } from './application';
import { applicationErrorHandler } from './errors/applicationErrorHandler';
const expressApp: Express = express();

let application: Application;
export const createApplication = async (): Promise<Application> => {
  setServerDirectory(__dirname);
  application = BaseApplication.init(new Application(expressApp));
  await application.setUp();

  return application;
};

export const start = async (): Promise<void> => {
  try {
    (await createApplication()).start();
  } catch (e) {
    applicationErrorHandler(e as Error);
    process.exit(1);
  }
};

export const cleanUp = async (): Promise<void> => {
  try {
    await application.cleanUp();
  } catch (e) {
    applicationErrorHandler(e as Error);
  }
};

process.on(`SIGINT`, cleanUp);
process.on(`SIGTERM`, cleanUp);
process.on(`close`, cleanUp);
