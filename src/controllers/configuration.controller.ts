import { commonResponses, getMsConfResponses } from '@/msApiResponses';
import { areRequiredQueryParamsSet, isValidMsApiKeySet } from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getMsConf = (req: Request, res: Response) => {
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

  return res.status(HTTPStatusCodes.OK).json(getMsConfResponses.correctResponse);
};

export default { getMsConf };
