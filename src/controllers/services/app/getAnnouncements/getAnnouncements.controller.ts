import {
  commonResponses,
  getAnnouncementResponses,
  getAnnouncementsListResponses,
  getAttachementBytesResponses,
} from '@/msApiResponses';
import { areRequiredQueryParamsSet, isValidBearerTokenSet } from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const getAnnouncementsList = (req: Request, res: Response) => {
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

  return res.status(HTTPStatusCodes.OK).json(getAnnouncementsListResponses.correctResponse);
};

const getAnnouncement = (req: Request, res: Response) => {
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

  return res.status(HTTPStatusCodes.OK).json(getAnnouncementResponses.correctResponse);
};

const getAttachmentBytes = (req: Request, res: Response) => {
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

  return res.status(HTTPStatusCodes.OK).json(getAttachementBytesResponses.correctResponse);
};

export default { getAnnouncementsList, getAnnouncement, getAttachmentBytes };
