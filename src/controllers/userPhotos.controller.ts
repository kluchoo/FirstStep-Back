import { commonResponses, getPersonPictureAsyncResponses } from '@/msApiResponses';
import {
  areRequiredQueryParamsSet,
  isValidBearerTokenSet,
  isValidMsApiKeySet,
} from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getPersonPictureAsync = (req: Request, res: Response) => {
  if (!isValidBearerTokenSet(req)) {
    return res.status(HTTPStatusCodes.UNAUTHORIZED).json(commonResponses.unauthorizedResponse);
  }

  const requiredQueryParams = [
    'Id',
    'PersonType',
    'IdLoggedPersonType',
    'TwoLetterISOLanguageName',
    'ClientVersion',
  ];

  if (!areRequiredQueryParamsSet(req, requiredQueryParams)) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json(commonResponses.badRequestResponse);
  }

  if (!isValidMsApiKeySet(req)) {
    return res.status(HTTPStatusCodes.OK).json(commonResponses.badMsApiKeyResponse);
  }

  return res.status(HTTPStatusCodes.OK).json(getPersonPictureAsyncResponses.correctResponse);
};

export default { getPersonPictureAsync };
