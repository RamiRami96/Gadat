export const environment = {
  production: true,
  /** The extension page is not served from the API's origin, so the API URL must be absolute. */
  apiBase: 'http://localhost:3000/api',
  /** Extension pages live at chrome-extension://<id>/index.html, so routes go after the "#". */
  useHash: true,
};
