import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { ToastController } from "@ionic/angular/lazy";

import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { TabItem } from "../../components/common/bottom-tabs/bottom-tabs.component";
import {
  formatDayMonth,
  formatINR,
  formatShortDate,
  formatTime,
} from "../../core/utils/format.utils";
import {
  BillItem,
  FamilyMember,
  NoticeItem,
  Vehicle,
  VisitorItem,
  VisitorType,
} from "../../core/models/society.models";

type ResidentTab = "home" | "bills" | "visitors" | "support";

@Component({
  selector: "app-resident",
  templateUrl: "./resident.component.html",
  styleUrls: ["./resident.component.scss"],
  standalone: false,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ResidentComponent implements OnInit {
  activeTab: ResidentTab = "home";
  readonly formatINR = formatINR;
  readonly formatTime = formatTime;
  readonly formatShortDate = formatShortDate;
  readonly formatDayMonth = formatDayMonth;

  readonly tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
    { id: "bills", label: "Bills", icon: "card-outline", iconActive: "card" },
    { id: "visitors", label: "Visitors", icon: "people-outline", iconActive: "people" },
    { id: "support", label: "Support", icon: "chatbubble-outline", iconActive: "chatbubble" },
  ];

  readonly quickActions = [
    { id: "pay", name: "Pay Bill", icon: "card-outline", color: "#059669", bg: "#ECFDF5" },
    { id: "complaint", name: "Complaint", icon: "chatbubble-outline", color: "#EA580C", bg: "#FFEDD5" },
    { id: "visitor", name: "Visitor", icon: "person-add-outline", color: "#2563EB", bg: "#EFF6FF" },
    { id: "notices", name: "Notices", icon: "notifications-outline", color: "#7C3AED", bg: "#F5F3FF" },
    { id: "noc", name: "NOC", icon: "document-text-outline", color: "#0D9488", bg: "#CCFBF1" },
    { id: "parking", name: "Parking", icon: "car-outline", color: "#DB2777", bg: "#FCE7F3" },
    { id: "request", name: "Request", icon: "construct-outline", color: "#D97706", bg: "#FEF3C7" },
    { id: "receipts", name: "Receipts", icon: "download-outline", color: "#059669", bg: "#D1FAE5" },
  ];

  readonly supportLinks = [
    { id: "complaint", title: "Raise Complaint", sub: "Report an issue", icon: "chatbubble-outline" },
    { id: "notifications", title: "Notification Prefs", sub: "SMS, WhatsApp, Push", icon: "notifications-outline" },
    { id: "security", title: "Security", sub: "PIN & biometric", icon: "shield-outline" },
    { id: "documents", title: "My Documents", sub: "Agreement, receipts, NOCs", icon: "document-text-outline" },
  ];

  residentName = "";
  email = "";
  flatNumber = "";
  tower = "";
  floor = "";
  ownership = "";
  isLoading = true;

  allBills: BillItem[] = [];
  currentBill: BillItem | null = null;
  notices: NoticeItem[] = [];
  visitors: VisitorItem[] = [];
  familyMembers: FamilyMember[] = [];
  vehicles: Vehicle[] = [];

  isPaymentModalOpen = false;
  isVisitorModalOpen = false;
  isPaying = false;
  newVisitorName = "";
  newVisitorPhone = "";
  newVisitorType: VisitorType = "Guest";

  /** Every unpaid bill added up — shown on the Bills tab. */
  get outstanding(): number {
    return this.allBills
      .filter((b) => b.status !== "paid")
      .reduce((sum, b) => sum + b.amount, 0);
  }

  get billPaid(): boolean {
    return this.outstanding === 0;
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadResidentData();
  }

  loadResidentData() {
    this.apiService.getResidentDashboard().subscribe({
      next: (data) => {
        this.residentName = data.residentName;
        this.email = data.email;
        this.flatNumber = data.flatNumber;
        this.tower = data.tower;
        this.floor = data.floor;
        this.ownership = data.ownership;
        this.allBills = data.allBills;
        this.currentBill = data.currentBill;
        this.notices = data.notices;
        this.visitors = data.recentVisitors;
        this.familyMembers = data.familyMembers;
        this.vehicles = data.vehicles;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast("Could not load your dashboard. Check your connection.");
      },
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab as ResidentTab;
  }

  handleQuickAction(actionId: string) {
    if (actionId === "pay") {
      this.switchTab("bills");
      return;
    }
    if (actionId === "visitor") {
      this.switchTab("visitors");
      return;
    }
    if (actionId === "notices") {
      this.switchTab("home");
      return;
    }
    this.showToast(`${actionId} is coming soon`);
  }

  openPaymentModal() {
    if (this.billPaid) {
      this.showToast("All bills are already paid");
      return;
    }
    this.isPaymentModalOpen = true;
  }

  closePaymentModal() {
    this.isPaymentModalOpen = false;
  }

  confirmPayment() {
    if (this.isPaying) return;

    this.isPaying = true;
    this.apiService.payBill(this.flatNumber).subscribe({
      next: (res) => {
        this.isPaying = false;
        this.closePaymentModal();
        this.showToast(`Payment of ${formatINR(res.bill.amount)} successful`);
        this.loadResidentData();
      },
      error: () => {
        this.isPaying = false;
        this.showToast("Payment failed. Please try again.");
      },
    });
  }

  openPreApproveModal() {
    this.isVisitorModalOpen = true;
  }

  closeVisitorModal() {
    this.isVisitorModalOpen = false;
  }

  submitPreApprove() {
    if (!this.newVisitorName.trim()) {
      this.showToast("Please enter the visitor name");
      return;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(this.newVisitorPhone.trim())) {
      this.showToast("Please enter a valid 10-digit mobile number");
      return;
    }

    this.apiService
      .preApproveVisitor({
        name: this.newVisitorName.trim(),
        phone: this.newVisitorPhone.trim(),
        visitorType: this.newVisitorType,
        destinationFlat: this.flatNumber,
      })
      .subscribe({
        next: (res) => {
          this.closeVisitorModal();
          this.newVisitorName = "";
          this.newVisitorPhone = "";
          this.newVisitorType = "Guest";
          this.showToast(`Gate pass sent. Code ${res.visitor.otpCode}`);
          this.loadResidentData();
        },
        error: () => this.showToast("Could not pre-approve the visitor"),
      });
  }

  /** "Car · Motorcycle" — the subtitle under the VEHICLES tile. */
  get vehicleSummary(): string {
    const types = [...new Set(this.vehicles.map((v) => v.type))];
    return types.length ? types.join(" · ") : "None registered";
  }

  /** Maps a stored status onto the wording used on the visitor chips. */
  visitorStatusLabel(visitor: VisitorItem): string {
    return visitor.status === "Exited" ? "Left" : visitor.status;
  }

  billStatusTone(status: BillItem["status"]): string {
    if (status === "paid") return "green";
    return status === "overdue" ? "red" : "amber";
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

  visitorTint(type: VisitorType): string {
    const tints: Record<VisitorType, string> = {
      Guest: "#FEF3C7",
      Delivery: "#FFEDD5",
      Staff: "#DCFCE7",
      Vendor: "#EDE9FE",
      Cab: "#DBEAFE",
      Other: "#F1F5F9",
    };
    return tints[type];
  }

  async downloadReceipt(bill: BillItem) {
    this.showToast(`Receipt for ${bill.billingMonth} downloaded`);
  }

  switchRole() {
    this.router.navigate(["/role-select"]);
  }

  signOut() {
    this.authService.logout();
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
