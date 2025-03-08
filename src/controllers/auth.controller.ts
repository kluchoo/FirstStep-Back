import { FAKE_PASSWORD, FAKE_USERNAME } from '@/fakeCredentials';
import { authenticateResponses, commonResponses } from '@/msApiResponses';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const authenticate = (req: Request, res: Response) => {
  const requiredFields = [
    'UserNameOrEmailAddress',
    'Password',
    'TwoFactorVerificationCode',
    'RememberClient',
    'TwoFactorRememberClientToken',
    'SingleSignIn',
    'ReturnUrl',
    'DeviceFirebaseToken',
  ];

  const requestBody = req.body;

  for (const requiredField of requiredFields) {
    if (requestBody[requiredField] === undefined) {
      return res.status(HTTPStatusCodes.BAD_REQUEST).json(commonResponses.badRequestResponse);
    }
  }

  if (
    requestBody.UserNameOrEmailAddress !== FAKE_USERNAME ||
    requestBody.Password !== FAKE_PASSWORD
  ) {
    return res
      .status(HTTPStatusCodes.INTERNAL_SERVER_ERROR)
      .json(authenticateResponses.invalidCredentialsResponse);
  }

  return res.status(HTTPStatusCodes.OK).json(authenticateResponses.correctResponse);
};

export default { authenticate };
