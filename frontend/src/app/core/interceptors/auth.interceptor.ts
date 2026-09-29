import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Observable, from, throwError } from "rxjs";
import { catchError, switchMap } from "rxjs/operators";
import { Router } from "@angular/router";

import { AuthService } from "../services/auth.service";

/** Endpoints that must never carry a stale token or trigger a refresh loop. */
const AUTH_ENDPOINTS = ["/auth/login", "/auth/refresh"];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS.some((path) => url.includes(path));
}

function withToken(req: HttpRequest<unknown>, token: string) {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Attaches the access token to every API call and, when the server answers 401,
 * refreshes once and replays the original request. A second failure ends the
 * session and sends the user back to role selection.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token;
  const outgoing = token && !isAuthEndpoint(req.url) ? withToken(req, token) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      const isUnauthorized =
        error instanceof HttpErrorResponse && error.status === 401;

      if (!isUnauthorized || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      return from(auth.refreshSession()).pipe(
        switchMap((freshToken) => {
          if (!freshToken) {
            router.navigate(["/role-select"]);
            return throwError(() => error);
          }
          return next(withToken(req, freshToken));
        })
      );
    })
  );
};
