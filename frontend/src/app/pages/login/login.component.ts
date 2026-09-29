import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService, ROLE_CONFIGS, RoleConfig } from "../../core/services/auth.service";
import { ToastController, LoadingController } from "@ionic/angular/lazy";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  standalone: false,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LoginComponent implements OnInit {
  roleConfig: RoleConfig = ROLE_CONFIGS["admin"];
  email = "";
  password = "";
  showPassword = false;
  isAuthenticating = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.authService.selectedRole$.subscribe((role) => {
      this.roleConfig = ROLE_CONFIGS[role];
      this.email = this.roleConfig.defaultEmail;
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async signIn() {
    await this.performAuth();
  }

  /** Biometric and QR are demo shortcuts into the same password flow. */
  async biometricAuth() {
    await this.notify("Touch fingerprint sensor or scan Face ID...");
    await this.performAuth();
  }

  async qrAuth() {
    await this.notify("Scanning Society ID Card QR...");
    await this.performAuth();
  }

  private async notify(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: "bottom",
      color: "dark",
    });
    await toast.present();
  }

  private async performAuth() {
    if (this.isAuthenticating) return;

    if (!this.email.trim() || !this.password) {
      await this.notify("Enter your email and password to continue.");
      return;
    }

    this.isAuthenticating = true;
    const loading = await this.loadingCtrl.create({
      message: "Verifying credentials...",
      spinner: "crescent",
    });
    await loading.present();

    try {
      const user = await this.authService.login(this.email.trim(), this.password);
      await loading.dismiss();
      this.router.navigate([ROLE_CONFIGS[user.role].homePath]);
    } catch (error) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: error instanceof Error ? error.message : "Unable to sign in.",
        duration: 3000,
        position: "bottom",
        color: "danger",
      });
      await toast.present();
    } finally {
      this.isAuthenticating = false;
    }
  }

  goBack() {
    this.router.navigate(["/role-select"]);
  }
}
