import { Request, Response } from '@men-mvc/essentials/lib/express';
import {
  errorResponse,
  InsufficientPermissionError,
  insufficientPermissionsResponse,
  resolveValidationError,
  StatusCodes,
  UploadMaxFileSizeError,
  ValidationError,
  validationErrorResponse
} from '@men-mvc/essentials';
import joi from '@men-mvc/essentials/lib/joi';
import { applicationErrorHandler } from './applicationErrorHandler';

export const requestErrorHandler = (
  err: Error,
  req: Request,
  res: Response
): Response => {
  /**
   * does not log error for validation error
   */
  if (err instanceof ValidationError) {
    return validationErrorResponse(res, err);
  }
  if (err instanceof joi.ValidationError) {
    /**
     * Joi async validation failed.
     */
    return validationErrorResponse(res, resolveValidationError(err));
  }
  if (err instanceof InsufficientPermissionError) {
    return insufficientPermissionsResponse(res, err);
  }

  applicationErrorHandler(err);

  if (err instanceof UploadMaxFileSizeError) {
    return errorResponse(
      res,
      {
        code: err.name,
        message: err.message
      },
      StatusCodes.BAD_REQUEST
    );
  }

  return errorResponse(
    res,
    {
      message: err.message
    },
    StatusCodes.INTERNAL_SERVER_ERROR
  );
};
