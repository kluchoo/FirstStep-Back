import { app } from '@/app';
import { ENVIRONMENT } from './constants';

export const startServer = (port: string | number = 0): Promise<ReturnType<typeof app.listen>> => {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        const address = server.address();

        let usedPort;

        if (address !== null && typeof address !== 'string') {
          usedPort = address.port;
        }

        if (ENVIRONMENT !== 'test') {
          console.log('Server up and running on port: ', usedPort);
        }
        resolve(server);
      })
      .on('error', (error) => {
        if (ENVIRONMENT !== 'test') {
          console.error('Failed to start server:', error);
        }
        reject(error);
      });
  });
};
