import { useCallback, useMemo } from 'react';
import {
  portalHref,
  portalPath,
  redirectToForbidden,
  redirectToLogin,
  redirectToPortal,
} from '../navigation/portalNavigation';
import type { PortalName } from '../navigation/portalNavigation';

export interface UsePortalNavigationReturn {
  href: (portal: PortalName, path?: string) => string;
  path: (portal: PortalName, path?: string) => string;
  navigate: (portal: PortalName, path?: string) => void;
  setTokenCookie: (token: string) => void;
  getRedirectTarget: () => string | null;
  navigateToLogin: (returnTo?: string) => void;
  navigateToForbidden: (resource?: string) => void;
}

/**
 * Navigation API for portal components.
 *
 * The underlying helpers preserve support for both deployed portal URLs and
 * direct file previews; this hook simply gives React components stable
 * callbacks without importing navigation utilities directly.
 */
export function usePortalNavigation(): UsePortalNavigationReturn {
  const href = useCallback((portal: PortalName, path = '') => portalHref(portal, path), []);
  const path = useCallback((portal: PortalName, targetPath = '') => portalPath(portal, targetPath), []);
  const navigate = useCallback((portal: PortalName, targetPath = '') => {
    redirectToPortal(portal, targetPath);
  }, []);
  const navigateToLogin = useCallback((returnTo?: string) => redirectToLogin(returnTo), []);
  const navigateToForbidden = useCallback((resource?: string) => redirectToForbidden(resource), []);

  /* ── Helpers ────────────────────────────────────────────────────────────────── */

  function setTokenCookie(token: string) {
    const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
    document.cookie = `notify_access_token=${token}; path=/; expires=${expires}; SameSite=Strict`;
  }

  function getRedirectTarget(): string | null {
    if (window.location.protocol === 'file:') {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/portals/') && !redirect.startsWith('/portals/login')) {
      return redirect;
    }
    return null;
  }

  return useMemo(() => ({
    href,
    path,
    navigate,
    setTokenCookie,
    getRedirectTarget,
    navigateToLogin,
    navigateToForbidden,
  }), [href, path, navigate, setTokenCookie, getRedirectTarget, navigateToLogin, navigateToForbidden]);

}
