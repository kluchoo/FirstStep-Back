import 'dotenv/config';

const { env } = process;

export const { ENVIRONMENT } = env;

export const DEFAULT_PORT = 4000;
export const DEV_SERVER_PORT = env.DEV_SERVER_PORT ?? DEFAULT_PORT;
export const COURSE_FLOW_API_PORT = env.COURSE_FLOW_API_PORT ?? DEFAULT_PORT;
