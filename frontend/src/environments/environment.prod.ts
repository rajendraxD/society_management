/**
 * Production environment.
 *
 * `apiBaseUrl` must be the public HTTPS origin of the deployed Express API.
 * The refresh-token cookie is `Secure` + `SameSite=None` in production, so an
 * `http://` URL here will break session refresh.
 */
export const environment = {
  production: true,
  apiBaseUrl: "https://api.your-domain.com/api",
};
