const configuredOrigin = (import.meta.env.PUBLIC_CONTACT_API_ORIGIN ?? '').replace(/\/+$/, '');

export const contactApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredOrigin}${normalizedPath}`;
};
