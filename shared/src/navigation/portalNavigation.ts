export type PortalName =
  | 'login'
  | 'events'
  | 'schedules'
  | 'logs'
  | 'agents'
  | 'clients'
  | 'templates'
  | 'domain'
  | 'vocab-rules'
  | 'memory'
  | 'settings'
  | 'dead-letters';

export function portalPath(portal: PortalName, path = ''): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `/portals/${portal}${suffix === '/' ? '/' : suffix}`;
}

export function portalHref(portal: PortalName, path = ''): string {
  const target = portalPath(portal, path);

  if (typeof window === 'undefined' || window.location.protocol !== 'file:') {
    return target;
  }

  const suffix = path.replace(/^\/+/, '');
  const targetFile = new URL(`../${portal}/index.html`, window.location.href);
  if (suffix) {
    targetFile.hash = `/${suffix}`;
  }
  return targetFile.href;
}

export function redirectToPortal(portal: PortalName, path = ''): void {
  window.location.href = portalHref(portal, path);
}

export function redirectToLogin(returnTo = currentPortalPath()): void {
  const login = portalHref('login');
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    window.location.href = login;
    return;
  }

  const separator = login.includes('?') ? '&' : '?';
  window.location.href = `${login}${separator}redirect=${encodeURIComponent(returnTo)}`;
}

export function redirectToForbidden(resource = currentPortalPath()): void {
  const forbidden = portalHref('login', '/forbidden');
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    window.location.href = forbidden;
    return;
  }

  const separator = forbidden.includes('?') ? '&' : '?';
  window.location.href = `${forbidden}${separator}resource=${encodeURIComponent(resource)}`;
}

export function currentPortalPath(): string {
  if (typeof window === 'undefined') return '/portals/events/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
