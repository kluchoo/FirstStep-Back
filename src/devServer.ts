import { DEV_SERVER_PORT } from './constants';
import { startServer } from './server';

startServer(DEV_SERVER_PORT).catch(() => process.exit(1));
