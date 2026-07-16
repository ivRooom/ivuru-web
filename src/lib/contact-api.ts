const configuredOrigin = (import.meta.env.PUBLIC_CONTACT_API_ORIGIN ?? '').replace(/\/+$/, '');

/** Resolve Contact API paths against the public Worker origin in Netlify builds. */
export const contactApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredOrigin}${normalizedPath}`;
};
