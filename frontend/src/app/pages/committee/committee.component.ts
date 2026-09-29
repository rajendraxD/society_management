import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { AlertController, ToastController } from "@ionic/angular/lazy";

import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { TabItem } from "../../components/common/bottom-tabs/bottom-tabs.component";
import {
  formatINR,
  formatShortDate,
  formatTime,
  formatTimeAgo,
} from "../../core/utils/format.utils";
import {
  CommitteeStats,
  FundBalanceItem,
  MeetingItem,
  MonthlyCollectionItem,
  MonthlySnapshot,
  NOCItem,
  RecentActionItem,
  VendorPaymentItem,
} from "../../core/models/society.models";

type CommitteeTab = "home" | "noc" | "meetings" | "finance";

@Component({
  selector: "app-committee",
  templateUrl: "./committee.component.html",
  styleUrls: ["./committee.component.scss"],
  standalone: false,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CommitteeComponent implements OnInit {
  activeTab: CommitteeTab = "home";
  readonly formatINR = formatINR;
  readonly formatShortDate = formatShortDate;
  readonly formatTime = formatTime;
  readonly formatTimeAgo = formatTimeAgo;

  readonly tabs: TabItem[] = [
    { id: "home", label: "Home", icon: "home-outline", iconActive: "home" },
    { id: "noc", label: "NOC", icon: "document-text-outline", iconActive: "document-text" },
    { id: "meetings", label: "Meetings", icon: "calendar-outline", iconActive: "calendar" },
    { id: "finance", label: "Finance", icon: "wallet-outline", iconActive: "wallet" },
  ];

  memberName = "";
  designation = "";
  societyName = "";
  isLoading = true;

  pendingNOCs: NOCItem[] = [];
  nocTypes: string[] = [];
  meetings: MeetingItem[] = [];
  snapshot: MonthlySnapshot | null = null;
  recentActions: RecentActionItem[] = [];
  fundBalances: FundBalanceItem[] = [];
  vendorPayments: VendorPaymentItem[] = [];
  monthlyCollection: MonthlyCollectionItem[] = [];

  stats: CommitteeStats = {
    pendingNOCs: 0,
    complaintEscalations: 0,
    staffApprovals: 0,
    vendorInvoices: 0,
  };

  selectedNoc: NOCItem | null = null;
  isDetailsModalOpen = false;

  /** The soonest meeting still ahead of us — drives the Next Meeting card. */
  get nextMeeting(): MeetingItem | null {
    return this.meetings[0] ?? null;
  }

  /** Highest bar value, used to scale the finance chart to a 0-100% height. */
  get maxMonthlyValue(): number {
    return Math.max(
      ...this.monthlyCollection.flatMap((m) => [m.income, m.expense]),
      1
    );
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadCommitteeData();
  }

  loadCommitteeData() {
    this.apiService.getCommitteeDashboard().subscribe({
      next: (data) => {
        this.pendingNOCs = data.pendingNOCs;
        this.nocTypes = data.nocTypes;
        this.stats = data.stats;
        this.meetings = data.meetings;
        this.snapshot = data.snapshot;
        this.recentActions = data.recentActions;
        this.fundBalances = data.fundBalances;
        this.vendorPayments = data.vendorPayments;
        this.monthlyCollection = data.monthlyCollection;
        this.memberName = data.memberName;
        this.designation = data.designation;
        this.societyName = data.societyName;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast("Could not load committee data. Check your connection.");
      },
    });
  }

  switchTab(tab: string) {
    this.activeTab = tab as CommitteeTab;
  }

  viewNocDetails(noc: NOCItem) {
    this.selectedNoc = noc;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.selectedNoc = null;
  }

  approveNOC(noc: NOCItem) {
    this.apiService.updateNOCStatus(noc.id, "Approved").subscribe({
      next: () => {
        this.closeDetailsModal();
        this.showToast(`NOC for ${noc.applicantName} approved. Signed copy sent.`);
        this.loadCommitteeData();
      },
      error: () => this.showToast("Could not approve this NOC"),
    });
  }

  async rejectNOC(noc: NOCItem) {
    const alert = await this.alertCtrl.create({
      header: "Reject NOC Request",
      inputs: [
        {
          name: "reason",
          type: "text",
          placeholder: "Reason (e.g. pending dues or incomplete docs)",
        },
      ],
      buttons: [
        { text: "Cancel", role: "cancel" },
        {
          text: "Confirm Reject",
          handler: (data) => {
            const reason = data.reason?.trim() || "Documents criteria not satisfied";
            this.apiService.updateNOCStatus(noc.id, "Rejected", reason).subscribe({
              next: () => {
                this.closeDetailsModal();
                this.showToast(`NOC for ${noc.applicantName} rejected.`);
                this.loadCommitteeData();
              },
              error: () => this.showToast("Could not reject this NOC"),
            });
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  viewAgenda() {
    this.switchTab("meetings");
  }

  rsvpMeeting(meeting: MeetingItem) {
    this.showToast(`RSVP confirmed for ${meeting.title}`);
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
