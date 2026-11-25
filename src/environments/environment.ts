export const environment = {
  production: false,
  // URL de tu Backend en Contabo VPS (reemplaza con tu IP o dominio, ej: 'https://api.tudominio.com' o 'http://123.45.67.89')
  backendProductionUrl: 'http://TU_IP_CONTABO',

  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      // En desarrollo local (localhost o red WiFi local)
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
        const host = hostname.includes(':') ? `[${hostname}]` : hostname;
        return `http://${host}:8000`;
      }
      // En producción (desplegado en Cloudflare Pages)
      return this.backendProductionUrl;
    }
    return 'http://127.0.0.1:8000';
  }
};
