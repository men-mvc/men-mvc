import supertest from 'supertest';
import {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload
} from './types';
import { getExpressApp } from './testUtilities';

const apiRoutePrefix = `/api`;

export const makeRegisterRequest = async (
  payload: Partial<RegisterPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${apiRoutePrefix}/auth/register`)
    .send(payload);

export const makeLoginRequest = async (
  payload: Partial<LoginPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${apiRoutePrefix}/auth/login`)
    .send(payload);

export const makeRequestPasswordResetRequest = async (
  email: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${apiRoutePrefix}/auth/request-password-reset`)
    .send({
      email
    });

export const makeResetPasswordRequest = async (
  payload: Partial<ResetPasswordPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${apiRoutePrefix}/auth/reset-password`)
    .send(payload);

export const makeMeRequest = async (
  accessToken: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .get(`${apiRoutePrefix}/auth/me`)
    .set(`Authorization`, accessToken ? `Bearer ${accessToken}` : ``)
    .send({});

export const makeVerifyEmailRequest = async (
  payload: Partial<VerifyEmailPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${apiRoutePrefix}/auth/verify-email`)
    .send(payload);
