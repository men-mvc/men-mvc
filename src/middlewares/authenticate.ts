import {
  Request,
  Response,
  NextFunction
} from '@men-mvc/foundation/lib/express';
import {
  unauthorisedErrorResponse,
  asyncRequestHandler,
  extractBearerToken
} from '@men-mvc/foundation';
import { verifyAuthToken } from '../services/authService';
import { findUserById } from '../services/userService';

const handler = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    return unauthorisedErrorResponse(res);
  }
  const payload = await verifyAuthToken(accessToken);
  if (!payload) {
    return unauthorisedErrorResponse(res);
  }
  const user = await findUserById(payload.id);
  if (!user) {
    return unauthorisedErrorResponse(res);
  }
  req.authUser = user;

  return next();
};

export const authenticate = asyncRequestHandler(handler);
