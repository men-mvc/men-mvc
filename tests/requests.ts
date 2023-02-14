import supertest from 'supertest';
import {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload
} from './types';
import { getExpressApp } from './testUtilities';

const pubicRoutePrefix = `/api/public`;
const protectedRoutePrefix = `/api/protected`;

export const makeRegisterRequest = async (
  payload: Partial<RegisterPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${pubicRoutePrefix}/register`)
    .send(payload);

export const makeLoginRequest = async (
  payload: Partial<LoginPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${pubicRoutePrefix}/login`)
    .send(payload);

export const makeRequestPasswordResetRequest = async (
  email: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${pubicRoutePrefix}/request-password-reset`)
    .send({
      email
    });

export const makeResetPasswordRequest = async (
  payload: Partial<ResetPasswordPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${pubicRoutePrefix}/reset-password`)
    .send(payload);

export const makeVerifyEmailRequest = async (
  payload: Partial<VerifyEmailPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${pubicRoutePrefix}/verify-email`)
    .send(payload);

export const makeResendVerifyEmailLinkRequest = async (
  email: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${pubicRoutePrefix}/email-verification-link/resend`)
    .send({ email });

export const makeMeRequest = async (
    accessToken: string
): Promise<supertest.Test> =>
    supertest(await getExpressApp())
        .get(`${protectedRoutePrefix}/me`)
        .set(`Authorization`, accessToken ? `Bearer ${accessToken}` : ``)
        .send({});
