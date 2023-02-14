import { Request, Response, Router } from '@men-mvc/core/lib/express';
import { asyncRequestHandler, requestHandler } from '@men-mvc/core';
import Application from '../application';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authenticate';

const apiRoutePrefix = `/api`;
export const registerRoutes = (application: Application) => {
  application.app.get('/', (req: Request, res: Response) => {
    res.send(`Hello from MEN MVC framework.`);
  });
  const protectedRouter = Router();
  const publicRouter = Router();

  /**
   * auth routes
   */
  publicRouter
    .route(`/auth/register`)
    .post(asyncRequestHandler(authController.register));
  publicRouter
    .route(`/auth/login`)
    .post(asyncRequestHandler(authController.login));
  publicRouter
    .route(`/auth/request-password-reset`)
    .post(asyncRequestHandler(authController.requestPasswordReset));
  publicRouter
    .route(`/auth/reset-password`)
    .put(asyncRequestHandler(authController.resetPassword));
  publicRouter
    .route(`/auth/verify-email`)
    .put(asyncRequestHandler(authController.verifyEmail));
  publicRouter
    .route(`/auth/email-verification-link/resend`)
    .post(asyncRequestHandler(authController.resendVerifyEmailLink));
  protectedRouter.route(`/auth/me`).get(requestHandler(authController.me));
  /**
   * end auth routes
   */

  application.app.use(apiRoutePrefix, publicRouter);
  application.app.use(apiRoutePrefix, authenticate, protectedRouter);
};
