import type { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: any;
}
