import { failValidationForField } from '@men-mvc/essentials';
import { findUserByEmail } from '../../services/userService';

export const validateUserEmailUnique = async (
  value: string,
  field: string,
  message?: string
) => {
  const user = await findUserByEmail(value);
  if (user) {
    failValidationForField(`email`, message ?? `Email has already been taken.`);
  }
};
