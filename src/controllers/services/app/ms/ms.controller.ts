import { commonResponses, getCoursesOfStudyResponses } from '@/msApiResponses';
import { areRequiredQueryParamsSet, isValidBearerTokenSet } from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getCoursesOfStudy = (req: Request, res: Response) => {
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

  return res.status(HTTPStatusCodes.OK).json(getCoursesOfStudyResponses.correctResponse);
};

export default { getCoursesOfStudy };
