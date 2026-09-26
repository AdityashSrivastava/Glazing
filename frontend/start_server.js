import { createServer } from 'vite';

async function start() {
  const server = await createServer({
    server: {
      port: 5173,
      host: '0.0.0.0'
    }
  });
  await server.listen();
  server.printUrls();

  setInterval(() => {}, 60000);
}

start();
