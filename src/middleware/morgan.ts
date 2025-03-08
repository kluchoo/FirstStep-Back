import { ENVIRONMENT } from '@/constants';
import { getStatusColor } from '@/utils/logging';
import chalk from 'chalk';
import morgan from 'morgan';

export const morganCustomDevFormatMiddleware = morgan(function (tokens, req, res) {
  if (
    !tokens.status ||
    !tokens.method ||
    !tokens.url ||
    !tokens['response-time'] ||
    !tokens.date ||
    !tokens['remote-addr'] ||
    !tokens['user-agent']
  ) {
    return null;
  }

  const status = tokens.status(req, res);

  if (ENVIRONMENT === 'test') {
    return null;
  }

  return [
    tokens.method(req, res),
    tokens.url(req, res),
    chalk[getStatusColor(status)](status),
    tokens['response-time'](req, res) + ' ms',
    tokens.date(req, res),
    tokens['remote-addr'](req, res),
    tokens['user-agent'](req, res),
  ].join(' ');
});
