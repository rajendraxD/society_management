import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { filter, map, take, timeout } from "rxjs/operators";

import { AuthService } from "../services/auth.service";
import { ROLE_CONFIGS } from "../services/auth.service";
import { UserRole } from "../models/society.models";

/**
 * Blocks a portal route until an access token exists, and rejects a role
 * mismatch (a resident token cannot open /admin).
 *
 * Client-side checks are UX only — the backend enforces the same rules on every
 * route, so a bypassed guard still returns 401/403.
 */
export const authGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    await auth.refreshSession();
  }

  if (!auth.isAuthenticated) {
    router.navigate(["/role-select"]);
    return false;
  }

  const expectedRole = route.data?.["role"] as UserRole | undefined;
  if (!expectedRole) return true;

  // The user arrives with the refresh response, so wait briefly rather than
  // bouncing a valid session to role-select on a slow network.
  const user = await firstValueFrom(
    auth.currentUser$.pipe(
      filter((u) => u !== null),
      take(1),
      timeout({ first: 5000, with: () => [] })
    )
  ).catch(() => null);

  if (user && user.role !== expectedRole) {
    router.navigate([ROLE_CONFIGS[user.role].homePath]);
    return false;
  }

  return true;
};
