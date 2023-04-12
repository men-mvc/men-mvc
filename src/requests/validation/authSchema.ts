import joi from '@men-mvc/essentials/lib/joi';
import { validateUserEmailUnique } from './rules';
import {
  LoginPayload,
  RegisterPayload,
  RequestPasswordResetPayload,
  ResendVerifyEmailLinkPayload,
  ResetPasswordPayload,
  VerifyEmailPayload
} from '../types';

const passwordRule = joi
  .string()
  .required()
  .trim()
  .min(8)
  .pattern(
    new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})')
  )
  .messages({
    'string.empty': `Password is required.`,
    'any.required': `Password is required.`,
    'string.min': `Password must have at least 8 characters.`,
    'string.pattern.base': `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  });

export const loginSchema = joi.object<LoginPayload>().keys({
  email: joi.string().required().trim().email().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`,
    'string.email': `Email format is invalid.`
  }),
  password: joi.string().required().messages({
    'string.empty': `Password is required.`,
    'any.required': `Password is required.`
  })
});

export const registerSchema = joi.object<RegisterPayload>().keys({
  name: joi.string().required().trim().messages({
    'string.empty': `Name is required.`,
    'any.required': `Name is required.`
  }),
  email: joi
    .string()
    .required()
    .trim()
    .email()
    .external(async (value) => {
      await validateUserEmailUnique(value, `email`);
    })
    .messages({
      'string.empty': `Email is required.`,
      'any.required': `Email is required.`,
      'string.email': `Email format is invalid.`
    }),
  password: passwordRule
});

export const requestPasswordResetSchema = joi
  .object<RequestPasswordResetPayload>()
  .keys({
    email: joi.string().required().trim().messages({
      'string.empty': `Email is required.`,
      'any.required': `Email is required.`
    })
  });

export const resetPasswordSchema = joi.object<ResetPasswordPayload>().keys({
  email: joi.string().required().trim().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`
  }),
  token: joi.string().required().trim().messages({
    'string.empty': `Token is required.`,
    'any.required': `Token is required.`
  }),
  newPassword: passwordRule,
  passwordConfirmation: joi
    .string()
    .valid(joi.ref(`newPassword`))
    .required()
    .messages({
      'string.empty': `Please confirm your password.`,
      'any.required': `Please confirm your password.`,
      'any.only': `Passwords do not match.`
    })
});

export const verifyEmailSchema = joi.object<VerifyEmailPayload>().keys({
  email: joi.string().required().trim().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`
  }),
  token: joi.string().required().trim().messages({
    'string.empty': `Token is required.`,
    'any.required': `Token is required.`
  })
});

export const resendVerifyEmailLinkSchema = joi
  .object<ResendVerifyEmailLinkPayload>()
  .keys({
    email: joi.string().required().trim().messages({
      'string.empty': `Email is required.`,
      'any.required': `Email is required.`
    })
  });
