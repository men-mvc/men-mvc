import { BaseApplication, setServerDirectory } from '@men-mvc/essentials';
import { express, Express } from '@men-mvc/essentials/lib/express';
import { Application } from './application';
import { applicationErrorHandler } from './errors/applicationErrorHandler';
const expressApp: Express = express();

export const createApplication = async (): Promise<Application> => {
  setServerDirectory(__dirname);
  const application = BaseApplication.init(new Application(expressApp));
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
