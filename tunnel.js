const localtunnel = require('localtunnel');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({
      port: 5173,
      subdomain: 'resolvedesk-portal'
    });

    console.log(`[Tunnel Live] Public URL: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log('[Tunnel] Connection closed. Restarting in 3 seconds...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.warn('[Tunnel Error]', err.message);
      try { tunnel.close(); } catch {}
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.warn('[Tunnel Init Error]', err.message);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
