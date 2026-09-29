import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";
import { User, UserRole } from "../models/society.models";
import { Router } from "@angular/router";
import { ApiService } from "./api.service";

export interface RoleConfig {
  id: UserRole;
  title: string;
  emoji: string;
  color: string;
  gradient: string;
  accentBg: string;
  defaultEmail: string;
  defaultName: string;
  subtitle: string;
  homePath: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    id: "admin",
    title: "Admin",
    emoji: "🏛️",
    color: "#1E40AF",
    gradient: "linear-gradient(135deg, #1E40AF 0%, #2563EB 60%, #3B82F6 100%)",
    accentBg: "#EFF6FF",
    defaultEmail: "rajesh.mehta@harmonysociety.in",
    defaultName: "Rajesh Mehta",
    subtitle: "Full society & financial access",
    homePath: "/admin",
  },
  resident: {
    id: "resident",
    title: "Resident",
    emoji: "🏠",
    color: "#059669",
    gradient: "linear-gradient(135deg, #047857 0%, #059669 60%, #10B981 100%)",
    accentBg: "#ECFDF5",
    defaultEmail: "priya.sharma@gmail.com",
    defaultName: "Priya Sharma",
    subtitle: "Flat dues, visitors & notices",
    homePath: "/resident",
  },
  security: {
    id: "security",
    title: "Security",
    emoji: "🛡️",
    color: "#DC2626",
    gradient: "linear-gradient(135deg, #B91C1C 0%, #DC2626 60%, #EF4444 100%)",
    accentBg: "#FEF2F2",
    defaultEmail: "suresh.guard@harmonysociety.in",
    defaultName: "Suresh Kumar",
    subtitle: "Gate entry & visitor log",
    homePath: "/security",
  },
  committee: {
    id: "committee",
    title: "Committee",
    emoji: "👥",
    color: "#7C3AED",
    gradient: "linear-gradient(135deg, #6D28D9 0%, #7C3AED 60%, #8B5CF6 100%)",
    accentBg: "#F5F3FF",
    defaultEmail: "anita.joshi@harmonysociety.in",
    defaultName: "Dr. Anita Joshi",
    subtitle: "NOC approvals & governance",
    homePath: "/committee",
  },
};

const ROLE_STORAGE_KEY = "society_selected_role";
const USER_STORAGE_KEY = "society_current_user";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private selectedRoleSubject = new BehaviorSubject<UserRole>("admin");
  public selectedRole$: Observable<UserRole> = this.selectedRoleSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  /**
   * The access token is deliberately kept in memory only — never in
   * localStorage, where any injected script could read it. A page reload costs
   * one silent refresh, which the httpOnly refresh cookie covers.
   */
  private accessToken: string | null = null;

  /** True while a refresh is in flight, so parallel 401s trigger only one. */
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(
    private router: Router,
    private api: ApiService
  ) {
    const savedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as UserRole) || "admin";
    this.selectedRoleSubject.next(savedRole);

    // Restore the display profile so a reload does not blank the header, then
    // confirm it against the API.
    const cached = localStorage.getItem(USER_STORAGE_KEY);
    if (cached) {
      try {
        this.currentUserSubject.next(JSON.parse(cached) as User);
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    void this.restoreSession();
  }

  get currentRole(): UserRole {
    return this.selectedRoleSubject.value;
  }

  get currentRoleConfig(): RoleConfig {
    return ROLE_CONFIGS[this.currentRole];
  }

  get token(): string | null {
    return this.accessToken;
  }

  get isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  setRole(role: UserRole) {
    this.selectedRoleSubject.next(role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }

  /**
   * Signs in against the API. Resolves with the user on success and throws an
   * Error carrying the server's message on failure, so the caller can show it.
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const session = await firstValueFrom(
        this.api.login({ email, password, role: this.currentRole })
      );

      this.applySession(session.user, session.accessToken);
      return session.user;
    } catch (error) {
      throw new Error(this.extractMessage(error));
    }
  }

  /** Clears the server-side session, then local state. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.api.logout());
    } catch {
      // A failed revoke must not trap the user in a signed-in shell — the
      // local session is cleared regardless.
    }
    this.clearSession();
    this.router.navigate(["/role-select"]);
  }

  /**
   * Trades the refresh cookie for a new access token. Concurrent callers share
   * one request. Resolves with the token, or null when the session is gone.
   */
  refreshSession(): Promise<string | null> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = firstValueFrom(this.api.refresh())
      .then((session) => {
        this.applySession(session.user, session.accessToken);
        return session.accessToken;
      })
      .catch(() => {
        this.clearSession();
        return null;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  /** Rehydrates an access token on app start when a refresh cookie is present. */
  private async restoreSession(): Promise<void> {
    await this.refreshSession();
  }

  private applySession(user: User, accessToken: string) {
    this.accessToken = accessToken;
    this.currentUserSubject.next(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    // Keep the role selector aligned with the account that actually signed in.
    if (user.role && user.role !== this.currentRole) {
      this.setRole(user.role);
    }
  }

  private clearSession() {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  /** Surfaces the backend's `message` when present, else a safe fallback. */
  private extractMessage(error: unknown): string {
    const httpError = error as { error?: { message?: string }; message?: string };
    return (
      httpError?.error?.message ||
      httpError?.message ||
      "Unable to sign in. Please try again."
    );
  }
}
