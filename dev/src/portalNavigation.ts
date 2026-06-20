export function portalHref(portal: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const serverPath = `/portals/${portal}${suffix === '/' ? '/' : suffix}`;

  if (window.location.protocol !== 'file:') {
    return serverPath;
  }

  const targetFile = new URL(`../../${portal}/dist/index.html`, window.location.href);
  const hashPath = path.replace(/^\/+/, '');
  if (hashPath) {
    targetFile.hash = `/${hashPath}`;
  }
  return targetFile.href;
}
