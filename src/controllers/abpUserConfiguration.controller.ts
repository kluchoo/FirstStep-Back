import { getAbpUserConfigurationResponses } from '@/msApiResponses';
import {} from '@/utils/common';
import type { Request, Response } from 'express';
import { StatusCodes as HTTPStatusCodes } from 'http-status-codes';

const GetAll = (req: Request, res: Response) => {
  return res.status(HTTPStatusCodes.OK).json(getAbpUserConfigurationResponses.correctResponse);
};

export default { GetAll };
