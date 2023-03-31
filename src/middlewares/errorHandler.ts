import { Request, Response, NextFunction } from '@men-mvc/core/lib/express';
import joi from '@men-mvc/core/lib/joi';
import {
  errorResponse,
  validationErrorResponse,
  UploadMaxFileSizeError,
  ValidationError,
  resolveValidationError,
  InsufficientPermissionError,
  insufficientPermissionsResponse,
  StatusCodes
} from '@men-mvc/core';
import { logger } from '@men-mvc/logger';

export const errorHandler = (
  err: Error | null,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!err) {
    return next();
  }
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

  /**
   * You can replace with your own logger class here
   * If you are using your own custom error logging class, you can uninstall @men-mvc/logger module.
   */
  logger.logError(err);

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
