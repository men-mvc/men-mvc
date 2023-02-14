import { Request, Response, NextFunction } from '@men-mvc/core/lib/express';
import { ValidationError as JoiValidationError } from 'joi';
import { StatusCodes } from 'http-status-codes';
import {
  errorResponse,
  validationErrorResponse,
  logger,
  UploadMaxFileSizeException,
  ValidationError,
  resolveValidationError,
  InsufficientPermissionError,
  insufficientPermissionsResponse
} from '@men-mvc/core';

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
  if (err instanceof JoiValidationError) {
    /**
     * Joi async validation failed.
     */
    return validationErrorResponse(res, resolveValidationError(err));
  }
  if (err instanceof InsufficientPermissionError) {
    return insufficientPermissionsResponse(res, err);
  }

  // log the error
  logger.logError(err);

  if (err instanceof UploadMaxFileSizeException) {
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
