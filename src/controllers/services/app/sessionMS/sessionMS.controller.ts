import { commonResponses, getCurrentLoginInformationResponses } from '@/msApiResponses';
import { isValidBearerTokenSet } from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getCurrentLoginInformation = (req: Request, res: Response) => {
  if (!isValidBearerTokenSet(req)) {
    return res
      .status(HTTPStatusCodes.INTERNAL_SERVER_ERROR)
      .json(commonResponses.internalServerErrorResponse);
  }

  return res.status(HTTPStatusCodes.OK).json(getCurrentLoginInformationResponses.correctResponse);
};

export default { getCurrentLoginInformation };
