import { Request, Response, Router } from '@men-mvc/foundation/lib/express';
import { asyncRequestHandler, requestHandler } from '@men-mvc/foundation';
import { Container } from 'typedi';
import { Application } from '../application';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middlewares';
import { config } from '../config';

export const publicRoutePrefix = `/api/public`;
export const protectedRoutePrefix = `/api/protected`;
export const registerRoutes = (application: Application) => {
  /**
   * controller instances should be inside registerRoutes function
   */
  const authController = Container.get(AuthController);

  application.app.get('/', (req: Request, res: Response) => {
    res.send(`Hello from ${config.app.name} framework.`);
  });
  const protectedRouter = Router();
  protectedRouter.use(authenticate);
  const publicRouter = Router();
  /**
   * auth routes
   */
  publicRouter.post(
    `/register`,
    asyncRequestHandler(async (req, res) => {
      await authController.register(req, res);
    })
  );
  publicRouter.post(
    `/login`,
    asyncRequestHandler(async (req, res) => {
      await authController.login(req, res);
    })
  );
  publicRouter.post(
    `/request-password-reset`,
    asyncRequestHandler(async (req, res) => {
      await authController.requestPasswordReset(req, res);
    })
  );
  publicRouter.put(
    `/reset-password`,
    asyncRequestHandler(async (req, res) => {
      await authController.resetPassword(req, res);
    })
  );
  publicRouter.put(
    `/verify-email`,
    asyncRequestHandler(async (req, res) => {
      await authController.verifyEmail(req, res);
    })
  );
  publicRouter.post(
    `/email-verification-link/resend`,
    asyncRequestHandler(async (req, res) => {
      await authController.resendVerifyEmailLink(req, res);
    })
  );
  protectedRouter.get(`/me`, requestHandler(authController.me));
  /**
   * end auth routes
   */

  application.app.use(publicRoutePrefix, publicRouter);
  application.app.use(protectedRoutePrefix, protectedRouter);
};
