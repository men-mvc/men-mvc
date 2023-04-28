import supertest from '@men-mvc/test/lib/supertest';
import { getExpressApp } from '../testUtilities';
import { protectedRoutePrefix, publicRoutePrefix } from '../../src/routes';
import {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyEmailPayload
} from '../../src/requests/types';

export const makeRegisterRequest = async (
  payload: Partial<RegisterPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${publicRoutePrefix}/register`)
    .send(payload);

export const makeLoginRequest = async (
  payload: Partial<LoginPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${publicRoutePrefix}/login`)
    .send(payload);

export const makeRequestPasswordResetRequest = async (
  email: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${publicRoutePrefix}/request-password-reset`)
    .send({
      email
    });

export const makeResetPasswordRequest = async (
  payload: Partial<ResetPasswordPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${publicRoutePrefix}/reset-password`)
    .send(payload);

export const makeVerifyEmailRequest = async (
  payload: Partial<VerifyEmailPayload>
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .put(`${publicRoutePrefix}/verify-email`)
    .send(payload);

export const makeResendVerifyEmailLinkRequest = async (
  email: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .post(`${publicRoutePrefix}/email-verification-link/resend`)
    .send({ email });

export const makeMeRequest = async (
  accessToken: string
): Promise<supertest.Test> =>
  supertest(await getExpressApp())
    .get(`${protectedRoutePrefix}/me`)
    .set(`Authorization`, accessToken ? `Bearer ${accessToken}` : ``)
    .send({});
