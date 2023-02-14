import { setServerDirectory } from '@men-mvc/core';
import { express, Express } from '@men-mvc/core/lib/express';
import Application from './application';
const app: Express = express();

const start = async (): Promise<void> => {
  try {
    setServerDirectory(__dirname);
    const application = new Application(app);
    await application.setUp();
    application.start();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

void start();
