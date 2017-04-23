import * as http from 'http';
import * as debug from 'debug';
import * as os from 'os';
import * as log4js from 'log4js';
import 'source-map-support/register';

import App from './App';

const elastic_host = process.env.ELASTIC_HOST || 'localhost';
const elastic_port = process.env.ELASTIC_PORT || 12201;

debug('ts-express:server');
log4js.configure({
  appenders: [
    { type: 'console' },
    {
      type: 'gelf',
      host: elastic_host,
      port: elastic_port,
      hostname: 'elastic-scheduler@' + os.hostname(),
      layout: {
        type: 'pattern',
        pattern: '%m'
      }
    }],
  replaceConsole: true
});

const port = normalizePort(process.env.PORT || 3210);
App.set('port', port);

const server = http.createServer(App);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: number | string): number | string | boolean {
  const localPort: number = (typeof val === 'string') ? parseInt(val, 10) : val;
  if (isNaN(localPort)) {
    return val;
  } else if (localPort >= 0) {
    return localPort;
  } else {
    return false;
  }
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = (typeof port === 'string') ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = (typeof addr === 'string') ? `pipe ${addr}` : `port ${addr.port}`;
  console.log(`Listening on ${bind}`);
  debug(`Listening on ${bind}`);
}
