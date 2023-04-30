import { BaseApplication, requestHandler } from '@men-mvc/foundation';
import {
  NextFunction,
  Request,
  Response
} from '@men-mvc/foundation/lib/express';

const handler = (req: Request, res: Response, next: NextFunction) => {
  BaseApplication.getInstance().setCurrentRequest(req);

  return next();
};

export const init = requestHandler(handler);
