import { NgModule } from "@angular/core";
import { PreloadAllModules, RouterModule, Routes } from "@angular/router";
import { authGuard } from "./core/guards/auth.guard";

const routes: Routes = [
  {
    path: "role-select",
    loadChildren: () =>
      import("./pages/role-select/role-select.module").then((m) => m.RoleSelectModule),
  },
  {
    path: "login",
    loadChildren: () =>
      import("./pages/login/login.module").then((m) => m.LoginModule),
  },
  {
    path: "admin",
    canActivate: [authGuard],
    data: { role: "admin" },
    loadChildren: () =>
      import("./pages/admin/admin.module").then((m) => m.AdminModule),
  },
  {
    path: "resident",
    canActivate: [authGuard],
    data: { role: "resident" },
    loadChildren: () =>
      import("./pages/resident/resident.module").then((m) => m.ResidentModule),
  },
  {
    path: "security",
    canActivate: [authGuard],
    data: { role: "security" },
    loadChildren: () =>
      import("./pages/security/security.module").then((m) => m.SecurityModule),
  },
  {
    path: "committee",
    canActivate: [authGuard],
    data: { role: "committee" },
    loadChildren: () =>
      import("./pages/committee/committee.module").then((m) => m.CommitteeModule),
  },
  {
    path: "",
    redirectTo: "role-select",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "role-select",
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
