import { AuthController } from './controllers/authController';

export class Controllers {
  /**
   * ! you can turn this into function if you want to inject dependencies or build a DI container
   */
  private readonly controllers = {
    [AuthController.token]: new AuthController()
  };

  public getController = <T>(token: string): T => {
    if (!this.controllers[token]) {
      throw new Error(`Controller with token ${token} does not exist.`);
    }

    return this.controllers[token] as T;
  };
}
