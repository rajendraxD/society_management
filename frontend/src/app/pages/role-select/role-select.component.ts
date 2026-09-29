import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService, ROLE_CONFIGS } from "../../core/services/auth.service";
import { UserRole } from "../../core/models/society.models";

/**
 * Copy that only the role picker needs. Title, emoji and gradient come from
 * ROLE_CONFIGS so the picker, login screen and portals cannot drift apart.
 */
const ROLE_BLURBS: Record<UserRole, { tagline: string }> = {
  admin: { tagline: "Full system access" },
  resident: { tagline: "Flat A-404 · 3 BHK" },
  security: { tagline: "Gate guard access" },
  committee: { tagline: "Governance & oversight" },
};

@Component({
  selector: "app-role-select",
  templateUrl: "./role-select.component.html",
  styleUrls: ["./role-select.component.scss"],
  standalone: false,
})
export class RoleSelectComponent {
  readonly roles = (Object.keys(ROLE_CONFIGS) as UserRole[]).map((id) => ({
    id,
    title: ROLE_CONFIGS[id].title,
    emoji: ROLE_CONFIGS[id].emoji,
    gradient: ROLE_CONFIGS[id].gradient,
    ...ROLE_BLURBS[id],
  }));

  constructor(private authService: AuthService, private router: Router) {}

  chooseRole(role: UserRole) {
    this.authService.setRole(role);
    // Replaced too, so the picker is not left one step behind the login screen
    // in the back stack.
    this.router.navigate(["/login"], { replaceUrl: true });
  }
}
