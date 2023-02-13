import express, { Express } from 'express';
import Application from './application';
import { setServerDirectory } from '@men-mvc/core';
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
