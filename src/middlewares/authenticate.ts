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
import { Container, Service } from 'typedi';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';

@Service()
class Authenticate {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  public async handle(req: Request, res: Response, next: NextFunction) {
    const accessToken = extractBearerToken(req);
    if (!accessToken) {
      return unauthorisedErrorResponse(res);
    }
    const payload = await this.authService.verifyAuthToken(accessToken);
    if (!payload) {
      return unauthorisedErrorResponse(res);
    }
    const user = await this.userService.findUserById(payload.id);
    if (!user) {
      return unauthorisedErrorResponse(res);
    }
    req.authUser = user;

    return next();
  }
}

export const authenticate = asyncRequestHandler(async (req, res, next) => {
  await Container.get(Authenticate).handle(req, res, next);
});
