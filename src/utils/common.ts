import { FAKE_BEARER_TOKEN } from '@/fakeCredentials';
import type { Request } from 'express';
import { md5 } from 'js-md5';
import moment from 'moment';

export const isValidBearerTokenSet = (request: Request) => {
  const { headers } = request;

  if (headers.authorization === undefined || typeof headers.authorization !== 'string') {
    return false;
  }

  const token = headers.authorization.split('Bearer ')[1];

  if (!token) {
    return false;
  }

  if (token !== FAKE_BEARER_TOKEN) {
    return false;
  }

  return true;
};

export const areRequiredQueryParamsSet = (request: Request, requiredQueryParams: string[]) => {
  const { query } = request;

  for (const requiredParam of requiredQueryParams) {
    if (query[requiredParam] === undefined) {
      return false;
    }
  }

  return true;
};

export const generateMsApiKey = (date?: string) => {
  const dateString = moment(date).format('YYYYMMDD');

  const str5 = `${dateString.at(7)}${dateString.at(2)}${dateString.at(3)}`;

  const str8 = `${dateString.at(1)}${dateString.at(6)}`;

  const str12 = `${dateString.at(0)}${dateString.at(5)}${dateString.at(4)}`;

  return md5(`${str5}aM@zoN^5kA${str8}d7*Un6La${str12}`).toUpperCase();
};

export const isValidMsApiKeySet = (request: Request) => {
  const { headers } = request;

  return headers['ms-api-key'] === generateMsApiKey();
};
