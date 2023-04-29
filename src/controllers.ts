import { AuthController } from './controllers/authController';

export class Controllers {
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
