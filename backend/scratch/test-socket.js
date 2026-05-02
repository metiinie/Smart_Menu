const net = require('net');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const host = new URL(connectionString).hostname;
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
