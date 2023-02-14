import joi from '@men-mvc/core/lib/joi';
import { validateUserEmailUnique } from './rules';

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

export const loginValSchema = joi.object().keys({
  email: joi
    .string()
    .required()
    .trim()
    .email({
      tlds: {
        allow: false
      }
    })
    .messages({
      'string.empty': `Email is required.`,
      'any.required': `Email is required.`,
      'string.email': `Email format is invalid.`
    }),
  password: joi.string().required().messages({
    'string.empty': `Password is required.`,
    'any.required': `Password is required.`
  })
});

export const registerValSchema = joi.object().keys({
  name: joi.string().required().trim().messages({
    'string.empty': `Name is required.`,
    'any.required': `Name is required.`
  }),
  email: joi
    .string()
    .required()
    .trim()
    .email({
      tlds: {
        allow: false
      }
    })
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

export const requestPasswordResetValSchema = joi.object().keys({
  email: joi.string().required().trim().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`
  })
});

export const resetPasswordValSchema = joi.object().keys({
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

export const verifyEmailValSchema = joi.object().keys({
  email: joi.string().required().trim().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`
  }),
  token: joi.string().required().trim().messages({
    'string.empty': `Token is required.`,
    'any.required': `Token is required.`
  })
});

export const resendVerifyEmailLinkValSchema = joi.object().keys({
  email: joi.string().required().trim().messages({
    'string.empty': `Email is required.`,
    'any.required': `Email is required.`
  })
});
