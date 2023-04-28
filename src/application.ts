import dotenv from 'dotenv';
dotenv.config();
import { Express, express } from '@men-mvc/essentials/lib/express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitise from 'express-mongo-sanitize';
import { getAppEnv, BaseApplication } from '@men-mvc/essentials';
import { logger } from '@men-mvc/logger';
import { config } from './config';
import { registerRoutes } from './routes';
import { init } from './middlewares/init';
import { requestErrorCatcher } from './middlewares/requestErrorCatcher';
import { apiThrottle } from './middlewares/apiThrottle';
import { database } from './database';
// import {registerMultipartFormParser} from "@men-mvc/filesystem";

export class Application extends BaseApplication {
  constructor(public app: Express) {
    super(app);
  }

  public initialise = async () => {
    if (config.database.mongo.uri) {
      await database.connect();
    }
  };

  public registerRoutes = () => {
    registerRoutes(this);
  };

  public initialisePreMiddlewares = () => {
    this.app.use(init);
    if (getAppEnv() !== 'test') {
      this.app.use(apiThrottle);
    }
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(hpp());
    this.app.use(express.json());
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
    /**
     * TODO: uncomment the following line to use @men-mvc/filesystem module after importing registerFilesystem from the module.
     * registerFilesystem(this.app);
     */
    // register new middlewares here.
  };

  public initialisePostMiddlewares = () => {
    // register new middlewares here
    this.app.use(requestErrorCatcher);
  };

  public cleanUp = async (): Promise<void> => {
    if (config.database.mongo.uri) {
      await database.close();
    }
  };

  public start = () => {
    this.app.listen(config.server.port, () => {
      console.log(
        `⚡️[server]: Server is running on port ${config.server.port}`
      );
    });
  };
}
