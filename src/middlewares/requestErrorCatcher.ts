import {
  Request,
  Response,
  NextFunction
} from '@men-mvc/foundation/lib/express';
import { requestErrorHandler } from '../errors/requestErrorHandler';

export const requestErrorCatcher = (
  err: Error | null,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!err) {
    return next();
  }

  return requestErrorHandler(err, req, res);
};
