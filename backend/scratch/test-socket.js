const net = require('net');

const host = 'ep-small-grass-ana26xxn.c-6.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Connecting to ${host}:${port}...`);
const socket = net.connect(port, host, () => {
  console.log('Connected!');
  socket.end();
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

socket.on('timeout', () => {
  console.error('Socket timeout');
  socket.destroy();
});

socket.setTimeout(10000);
