import { BaseApplication, requestHandler } from '@men-mvc/essentials';
import {
  NextFunction,
  Request,
  Response
} from '@men-mvc/essentials/lib/express';

const handler = (req: Request, res: Response, next: NextFunction) => {
  BaseApplication.getInstance().setCurrentRequest(req);

  return next();
};

export const init = requestHandler(handler);
