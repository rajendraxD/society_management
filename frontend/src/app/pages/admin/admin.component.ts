import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastController } from "@ionic/angular/lazy";
import { TabItem } from "../../components/common/bottom-tabs/bottom-tabs.component";
import { formatINR, formatShortDate } from "../../core/utils/format.utils";
import {
  AdminKPIs,
  AlertItem,
  DefaulterItem,
  ExpenseItem,
  ManagementModule,
  MonthlyCollectionItem,
  ReportItem,
} from "../../core/models/society.models";

type AdminTab = "home" | "modules" | "reports" | "account";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"],
  standalone: false,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminComponent implements OnInit {
  activeTab: AdminTab = "home";
  readonly formatINR = formatINR;
  readonly formatShortDate = formatShortDate;

  readonly tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
    { id: "modules", label: "Modules", icon: "grid-outline", iconActive: "grid" },
    { id: "reports", label: "Reports", icon: "bar-chart-outline", iconActive: "bar-chart" },
    { id: "account", label: "Account", icon: "settings-outline", iconActive: "settings" },
  ];

  societyName = "Harmony Heights";
  isLoading = true;

  /** Identity comes from the signed-in account, never from a literal. */
  adminName = "";
  adminEmail = "";
  adminTitle = "Society Admin";

  kpis: AdminKPIs = {
    todayCollection: 0,
    todayCollectionChange: "",
    pendingBillsCount: 0,
    pendingBillsOverdue: 0,
    defaultersCount: 0,
    defaultersChange: "",
    monthlyRevenue: "0",
    monthlyRevenueChange: "",
    openComplaints: 0,
    visitorsToday: 0,
    staffPresent: "0/0",
    activeQuarter: "",
    currentDateText: "",
  };

  monthlyCollection: MonthlyCollectionItem[] = [];
  expenseBreakdown: ExpenseItem[] = [];
  recentAlerts: AlertItem[] = [];
  defaulters: DefaulterItem[] = [];
  modules: ManagementModule[] = [];
  reports: ReportItem[] = [];

  /** Account tab rows; each opens the same module sheet as the Modules grid. */
  readonly accountSettings: ManagementModule[] = [
    { id: "notif", name: "Notifications", icon: "notifications-outline", badgeColor: "#EFF6FF", iconColor: "#3B82F6" },
    { id: "security", name: "Security & 2FA", icon: "shield-outline", badgeColor: "#EFF6FF", iconColor: "#3B82F6" },
    { id: "staff", name: "Manage Staff", icon: "people-outline", badgeColor: "#EFF6FF", iconColor: "#3B82F6" },
    { id: "society_settings", name: "Society Settings", icon: "business-outline", badgeColor: "#EFF6FF", iconColor: "#3B82F6" },
    { id: "billing_config", name: "Billing Config", icon: "document-text-outline", badgeColor: "#EFF6FF", iconColor: "#3B82F6" },
  ];

  selectedModule: ManagementModule | null = null;
  selectedReport: ReportItem | null = null;
  isReportModalOpen = false;
  isModuleModalOpen = false;

  /** Highest bar value, used to scale the chart to a 0-100% height. */
  get maxMonthlyValue(): number {
    return Math.max(
      ...this.monthlyCollection.flatMap((m) => [m.income, m.expense]),
      1
    );
  }

  /**
   * Donut ring geometry derived from the live percentages, so the chart can
   * never disagree with the legend beside it.
   */
  get donutSegments() {
    const circumference = 2 * Math.PI * 38;
    let consumed = 0;

    return this.expenseBreakdown.map((expense) => {
      const length = (expense.percentage / 100) * circumference;
      const segment = {
        color: expense.color,
        dashArray: `${length.toFixed(1)} ${(circumference - length).toFixed(1)}`,
        dashOffset: (-consumed).toFixed(1),
      };
      consumed += length;
      return segment;
    });
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (!user) return;
      this.adminName = user.name;
      this.adminEmail = user.email;
      this.adminTitle = user.title || "Society Admin";
    });

    this.loadAdminData();
  }

  loadAdminData() {
    this.apiService.getAdminDashboard().subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.monthlyCollection = data.monthlyCollection;
        this.expenseBreakdown = data.expenseBreakdown;
        this.recentAlerts = data.alerts;
        this.defaulters = data.defaulters;
        if (data.society?.name) {
          this.societyName = data.society.name.split(" ").slice(0, 2).join(" ");
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast("Could not reach the server. Check your connection.");
      },
    });

    this.apiService.getModules().subscribe({
      next: (mods) => (this.modules = mods),
      error: () => this.showToast("Could not load modules"),
    });

    this.apiService.getReports().subscribe({
      next: (reps) => (this.reports = reps),
      error: () => this.showToast("Could not load reports"),
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab as AdminTab;
  }

  openModuleDetails(mod: ManagementModule) {
    this.selectedModule = mod;
    this.isModuleModalOpen = true;
  }

  closeModuleModal() {
    this.isModuleModalOpen = false;
    this.selectedModule = null;
  }

  viewReport(report: ReportItem) {
    this.selectedReport = report;
    this.isReportModalOpen = true;
  }

  closeReportModal() {
    this.isReportModalOpen = false;
    this.selectedReport = null;
  }

  async downloadReport(report: ReportItem) {
    await this.showToast(`Downloading ${report.title} (PDF)...`, "success");
  }

  switchRole() {
    this.router.navigate(["/role-select"]);
  }

  signOut() {
    this.authService.logout();
  }

  private async showToast(message: string, color?: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      position: "bottom",
      color,
    });
    await toast.present();
  }
}
