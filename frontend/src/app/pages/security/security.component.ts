import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ToastController } from "@ionic/angular/lazy";

import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { TabItem } from "../../components/common/bottom-tabs/bottom-tabs.component";
import { formatTime } from "../../core/utils/format.utils";
import {
  ExpectedVisitorItem,
  GateLogItem,
  SecurityAlertItem,
  SecurityStats,
  VisitorItem,
  VisitorType,
} from "../../core/models/society.models";

type SecurityTab = "home" | "entry" | "log" | "alerts";

const VISITOR_TYPES: VisitorType[] = [
  "Guest",
  "Delivery",
  "Staff",
  "Vendor",
  "Cab",
  "Other",
];

@Component({
  selector: "app-security",
  templateUrl: "./security.component.html",
  styleUrls: ["./security.component.scss"],
  standalone: false,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class SecurityComponent implements OnInit, OnDestroy {
  activeTab: SecurityTab = "home";
  readonly formatTime = formatTime;
  readonly visitorTypes = VISITOR_TYPES;

  readonly tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
    { id: "entry", label: "Entry", icon: "add-outline", iconActive: "add" },
    { id: "log", label: "Log", icon: "clipboard-outline", iconActive: "clipboard" },
    { id: "alerts", label: "Alerts", icon: "notifications-outline", iconActive: "notifications" },
  ];

  guardName = "";
  shift = "";
  gate = "";
  currentDateText = "";
  clock = "";

  stats: SecurityStats = {
    activeInside: 0,
    visitorsToday: 0,
    deliveriesToday: 0,
    expectedToday: 0,
    totalLogEntries: 0,
    activeAlerts: 0,
    highPriorityAlerts: 0,
  };

  visitors: VisitorItem[] = [];
  gateLog: GateLogItem[] = [];
  expectedVisitors: ExpectedVisitorItem[] = [];
  alerts: SecurityAlertItem[] = [];
  isLoading = true;

  /* New-entry form */
  name = "";
  phone = "";
  visitorType: VisitorType = "Guest";
  destinationFlat = "";
  vehicleNumber = "";
  otpCode = "";
  isSubmitting = false;

  private clockTimer?: ReturnType<typeof setInterval>;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.generateNewOTP();
    this.startClock();
    this.loadGateData();
  }

  ngOnDestroy() {
    if (this.clockTimer) clearInterval(this.clockTimer);
  }

  /** Gate staff read the time off this header, so it ticks live. */
  private startClock() {
    const tick = () => {
      this.clock = new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date());
    };
    tick();
    this.clockTimer = setInterval(tick, 30_000);
  }

  loadGateData() {
    this.apiService.getSecurityDashboard().subscribe({
      next: (data) => {
        this.stats = data.stats;
        this.visitors = data.visitors;
        this.gateLog = data.gateLog;
        this.expectedVisitors = data.expectedVisitors;
        this.alerts = data.alerts;
        this.guardName = data.guardName;
        this.shift = data.shift;
        this.gate = data.gate;
        this.currentDateText = data.currentDateText;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast("Could not load the gate dashboard. Check your connection.");
      },
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab as SecurityTab;
  }

  generateNewOTP() {
    this.otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  }

  selectType(type: VisitorType) {
    this.visitorType = type;
  }

  registerEntry() {
    if (this.isSubmitting) return;

    if (!this.name.trim()) {
      this.showToast("Please enter the visitor name");
      return;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(this.phone.trim())) {
      this.showToast("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!/^[A-Z]-\d{1,4}$/i.test(this.destinationFlat.trim())) {
      this.showToast("Enter the flat as wing + number, e.g. A-404");
      return;
    }

    this.isSubmitting = true;
    this.apiService
      .checkInVisitor({
        name: this.name.trim(),
        phone: this.phone.trim(),
        visitorType: this.visitorType,
        destinationFlat: this.destinationFlat.trim().toUpperCase(),
        vehicleNumber: this.vehicleNumber.trim() || undefined,
        otpCode: this.otpCode,
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.resetEntryForm();
          this.showToast(`Entry registered. Resident of ${res.visitor.destinationFlat} notified.`);
          this.loadGateData();
          this.switchTab("home");
        },
        error: () => {
          this.isSubmitting = false;
          this.showToast("Could not register the entry. Please retry.");
        },
      });
  }

  markExit(visitor: VisitorItem) {
    this.apiService.markVisitorExit(visitor.id).subscribe({
      next: () => {
        this.showToast(`${visitor.name} marked as exited`);
        this.loadGateData();
      },
      error: () => this.showToast("Could not update the visitor status"),
    });
  }

  capturePhoto() {
    this.showToast("Camera permission is required to capture a photo");
  }

  sendOTP() {
    if (!/^\+?[0-9\s-]{10,15}$/.test(this.phone.trim())) {
      this.showToast("Enter the mobile number first");
      return;
    }
    this.generateNewOTP();
    this.showToast(`OTP ${this.otpCode} sent to the visitor`);
  }

  signOut() {
    this.authService.logout();
  }

  visitorIcon(type: VisitorType): string {
    const icons: Record<VisitorType, string> = {
      Guest: "person-outline",
      Delivery: "cube-outline",
      Staff: "home-outline",
      Vendor: "construct-outline",
      Cab: "car-outline",
      Other: "ellipsis-horizontal-outline",
    };
    return icons[type];
  }

  alertTone(severity: SecurityAlertItem["severity"]): string {
    return severity.toLowerCase();
  }

  visitorTint(type: VisitorType): string {
    const tints: Record<VisitorType, string> = {
      Guest: "#EDE9FE",
      Delivery: "#FFEDD5",
      Staff: "#FEF3C7",
      Vendor: "#F1F5F9",
      Cab: "#DBEAFE",
      Other: "#F1F5F9",
    };
    return tints[type];
  }

  private resetEntryForm() {
    this.name = "";
    this.phone = "";
    this.visitorType = "Guest";
    this.destinationFlat = "";
    this.vehicleNumber = "";
    this.generateNewOTP();
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2400,
      position: "bottom",
    });
    await toast.present();
  }
}
