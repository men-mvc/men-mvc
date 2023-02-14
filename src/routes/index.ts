import { Request, Response, Router } from '@men-mvc/core/lib/express';
import { asyncRequestHandler, requestHandler } from '@men-mvc/core';
import Application from '../application';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authenticate';

const publicRoutePrefix = `/api/public`;
const protectedRoutePrefix = `/api/protected`;
export const registerRoutes = (application: Application) => {
  application.app.get('/', (req: Request, res: Response) => {
    res.send(`Hello from MEN MVC framework.`);
  });
  const protectedRouter = Router();
  protectedRouter.use(authenticate);
  const publicRouter = Router();
  /**
   * auth routes
   */
  publicRouter.post(`/register`, asyncRequestHandler(authController.register));
  publicRouter.post(`/login`, asyncRequestHandler(authController.login));
  publicRouter.post(
    `/request-password-reset`,
    asyncRequestHandler(authController.requestPasswordReset)
  );
  publicRouter.put(
    `/reset-password`,
    asyncRequestHandler(authController.resetPassword)
  );
  publicRouter.put(
    `/verify-email`,
    asyncRequestHandler(authController.verifyEmail)
  );
  publicRouter.post(
    `/email-verification-link/resend`,
    asyncRequestHandler(authController.resendVerifyEmailLink)
  );
  protectedRouter.get(`/me`, requestHandler(authController.me));
  /**
   * end auth routes
   */

  application.app.use(publicRoutePrefix, publicRouter);
  application.app.use(protectedRoutePrefix, protectedRouter);
};
