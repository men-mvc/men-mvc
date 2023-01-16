import dotenv from 'dotenv';
dotenv.config();
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitise from 'express-mongo-sanitize';
import {
  logger,
  getAppEnv,
  AbstractApplication,
  registerMultipartFormParser
} from '@men-mvc/core';
import config from 'config';
import { registerRoutes } from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { apiThrottle } from './middlewares/apiThrottle';
import { database } from './database';

export default class Application extends AbstractApplication {
  constructor(public app: Express) {
    super(app);
  }

  public initialise = async () => {
    await database.connect();
  };

  public registerRoutes = () => {
    registerRoutes(this);
  };

  public initialisePreMiddlewares = () => {
    this.app.use(express.static('/public')); // for sharing/ serve files publicly
    if (getAppEnv() !== 'test') {
      this.app.use(apiThrottle);
    }
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(hpp());
    this.app.use(express.json());
    registerMultipartFormParser(this.app);
    this.app.use(helmet());
    this.app.use(mongoSanitise());
    this.app.disable(`x-powered-by`);
    this.app.use(cors());
    if (getAppEnv() !== 'production' && getAppEnv() !== 'test') {
      this.app.use(
        morgan(
          ':method :url :status :res[content-length] - :response-time ms',
          {
            stream: {
              write(str: string) {
                logger.logMessage(str);
              }
            }
          }
        )
      );
    }
    // register new middlewares here.
  };

  public initialisePostMiddlewares = () => {
    // register new middlewares here
    this.app.use(errorHandler);
  };

  public start = () => {
    this.app.listen(config.get<number>('server.port'), () => {
      console.log(
        `⚡️[server]: Server is running on port ${config.get<number>(
          'server.port'
        )}`
      );
    });
  };
}
