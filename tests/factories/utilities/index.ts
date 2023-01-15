import _ from 'lodash';
import { VerificationTokenType } from '../../../src/types';

export const getVerificationTokenTypes = (): VerificationTokenType[] => {
  return [
    VerificationTokenType.VERIFY_EMAIL,
    VerificationTokenType.PASSWORD_RESET
  ];
};

export const getRandomVerificationTokenType = (): VerificationTokenType =>
  _.sample(getVerificationTokenTypes()) as VerificationTokenType;
