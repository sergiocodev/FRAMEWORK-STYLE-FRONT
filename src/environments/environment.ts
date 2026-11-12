export const environment = {
  production: false,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      const host = hostname.includes(':') ? `[${hostname}]` : hostname;
      return `http://${host}:8000`;
    }
    return 'http://127.0.0.1:8000';
  }
};
