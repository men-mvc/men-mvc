export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
  passwordConfirmation: string;
};
