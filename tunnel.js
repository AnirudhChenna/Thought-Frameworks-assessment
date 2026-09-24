const localtunnel = require('localtunnel');

let activeTunnel = null;

async function startTunnel() {
  if (activeTunnel) {
    try { activeTunnel.close(); } catch {}
    activeTunnel = null;
  }

  try {
    const tunnel = await localtunnel({
      port: 5173,
      subdomain: 'resolvedesk-portal'
    });

    activeTunnel = tunnel;
    console.log(`[Tunnel Live] URL: ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log('[Tunnel] Disconnected. Reopening in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.warn('[Tunnel Notice]', err.message);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.warn('[Tunnel Notice] Retrying in 4s...', err.message);
    setTimeout(startTunnel, 4000);
  }
}

// Keep event loop alive permanently
setInterval(() => {}, 1000 * 60 * 60);

process.on('uncaughtException', (err) => {
  console.warn('[Process Notice]', err.message);
  setTimeout(startTunnel, 3000);
});

process.on('unhandledRejection', (err) => {
  console.warn('[Process Notice]', err?.message || err);
});

startTunnel();
