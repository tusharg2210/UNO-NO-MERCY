/** Default when VITE_SERVER_URL is unset (local backend). */
const FALLBACK = 'http://localhost:5100';

function getEnvServerUrl() {
  return import.meta.env.VITE_SERVER_URL || FALLBACK;
}

/** True when `npm run dev` and env points at a remote host (use Vite proxy, same-origin). */
export function isRemoteDevProxy() {
  const envUrl = getEnvServerUrl();
  return (
    import.meta.env.DEV &&
    /^https?:\/\//.test(envUrl) &&
    !/localhost|127\.0\.0\.1/.test(envUrl)
  );
}

/** Base URL for `fetch()` — empty string uses same origin (Vite proxies `/api`). */
export function getApiBaseUrl() {
  return isRemoteDevProxy() ? '' : getEnvServerUrl();
}

/** Origin for Socket.io client — full URL for `io()`. */
export function getSocketIoUrl() {
  const envUrl = getEnvServerUrl();
  if (isRemoteDevProxy() && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return envUrl;
}
