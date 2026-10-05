// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  /**
   * Express API origin.
   *
   *  - Browser dev server .......... http://localhost:5000/api
   *  - Android emulator ........... http://10.0.2.2:5000/api  (10.0.2.2 = host)
   *  - Physical Android device .... http://<your-LAN-IP>:5000/api
   *
   * Whichever you pick, add the matching origin to the backend `CLIENT_URL`
   * allow-list or CORS will reject the request.
   */
  // Browser dev server: http://localhost:5000/api
  // Android emulator: http://10.0.2.2:5000/api
  // Physical Android device: http://<your-LAN-IP>:5000/api
  apiBaseUrl: "http://localhost:5000/api",
};
