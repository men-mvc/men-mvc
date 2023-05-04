import { failValidationForField } from '@men-mvc/foundation';
import { Service } from 'typedi';
import { UserService } from '../../services/userService';

@Service()
export class UserEmailUnique {
  constructor(private readonly userService: UserService) {}

  async validate(value: string, field: string, message?: string) {
    if (await this.userService.findUserByEmail(value)) {
      failValidationForField(
        `email`,
        message ?? `Email has already been taken.`
      );
    }
  }
}
