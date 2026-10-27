export const apiUrl = (path: string) =>
  path.startsWith('/') ? path : `/${path}`;
