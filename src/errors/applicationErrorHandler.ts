import { logger } from '@men-mvc/logger';

export const applicationErrorHandler = (error: Error) => {
  /**
   * You can replace with your own logger class here
   * If you are using your own custom error logging class, you can uninstall @men-mvc/logger module.
   */
  logger.logError(error);
};
