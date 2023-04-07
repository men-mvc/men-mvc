import { setServerDirectory } from '@men-mvc/essentials';
import { express, Express } from '@men-mvc/essentials/lib/express';
import Application from './application';
import { applicationErrorHandler } from './errors/applicationErrorHandler';
const app: Express = express();

const start = async (): Promise<void> => {
  try {
    setServerDirectory(__dirname);
    const application = new Application(app);
    await application.setUp();
    application.start();
  } catch (e) {
    applicationErrorHandler(e as Error);
    process.exit(1);
  }
};

void start();
