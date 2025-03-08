import { commonResponses, getMyClassScheduleResponses } from '@/msApiResponses';
import { areRequiredQueryParamsSet, isValidBearerTokenSet } from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getMyClassSchedule = (req: Request, res: Response) => {
  if (!isValidBearerTokenSet(req)) {
    return res.status(HTTPStatusCodes.UNAUTHORIZED).json(commonResponses.unauthorizedResponse);
  }

  const requiredQueryParams = [
    'Id',
    'PersonType',
    'IdLoggedPersonType',
    'TwoLetterISOLanguageName',
    'ClientVersion',
    'DateFrom',
    'DateTo',
    'ScheduleIncidentType',
    'ScheduleType',
  ];

  if (!areRequiredQueryParamsSet(req, requiredQueryParams)) {
    return res.status(HTTPStatusCodes.BAD_REQUEST).json(commonResponses.badRequestResponse);
  }

  switch (req.query['ScheduleType']) {
    case 'Student': {
      return res.status(HTTPStatusCodes.OK).json(getMyClassScheduleResponses.correctResponseMyPlan);
    }
    case 'GroupsForStudent': {
      return res
        .status(HTTPStatusCodes.OK)
        .json(getMyClassScheduleResponses.correctResponseMyGroupPlan);
    }
  }

  return res.status(HTTPStatusCodes.BAD_REQUEST).json(commonResponses.badRequestResponse);
};

export default { getMyClassSchedule };
