export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
  passwordConfirmation: string;
};

export type VerifyEmailPayload = {
  email: string;
  token: string;
};
