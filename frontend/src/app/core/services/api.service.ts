import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { environment } from "../../../environments/environment";
import {
  AdminKPIs,
  AlertItem,
  ApiResponse,
  BillItem,
  CommitteeStats,
  ComplaintCategory,
  ComplaintItem,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintSummary,
  DefaulterItem,
  ExpenseItem,
  ExpectedVisitorItem,
  FamilyMember,
  FundBalanceItem,
  GateLogItem,
  ManagementModule,
  MeetingItem,
  MonthlyCollectionItem,
  MonthlySnapshot,
  NOCItem,
  NoticeItem,
  RecentActionItem,
  ReportItem,
  SecurityAlertItem,
  SecurityStats,
  User,
  Vehicle,
  VendorPaymentItem,
  VisitorItem,
} from "../models/society.models";

export interface AdminDashboard {
  society: { name: string };
  kpis: AdminKPIs;
  monthlyCollection: MonthlyCollectionItem[];
  expenseBreakdown: ExpenseItem[];
  alerts: AlertItem[];
  defaulters: DefaulterItem[];
}

export interface ResidentDashboard {
  flatNumber: string;
  wing: string;
  tower: string;
  floor: string;
  ownership: string;
  residentName: string;
  email: string;
  currentBill: BillItem | null;
  allBills: BillItem[];
  notices: NoticeItem[];
  recentVisitors: VisitorItem[];
  familyMembers: FamilyMember[];
  vehicles: Vehicle[];
}

export interface ResidentBills {
  flatNumber: string;
  outstanding: number;
  bills: BillItem[];
}

export interface SecurityDashboard {
  stats: SecurityStats;
  visitors: VisitorItem[];
  gateLog: GateLogItem[];
  expectedVisitors: ExpectedVisitorItem[];
  alerts: SecurityAlertItem[];
  gate: string;
  guardName: string;
  shift: string;
  currentDateText: string;
}

/** Payload of a successful login or refresh. */
export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface CommitteeDashboard {
  pendingNOCs: NOCItem[];
  stats: CommitteeStats;
  meetings: MeetingItem[];
  snapshot: MonthlySnapshot;
  recentActions: RecentActionItem[];
  fundBalances: FundBalanceItem[];
  vendorPayments: VendorPaymentItem[];
  nocTypes: string[];
  monthlyCollection: MonthlyCollectionItem[];
  memberName: string;
  designation: string;
  societyName: string;
}

/**
 * Centralized HTTP access to the Society Management API.
 * Every method unwraps the `{ success, message, data }` envelope so components
 * only ever deal with domain objects.
 */
@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  private unwrap<T>() {
    return map((res: ApiResponse<T>) => res.data);
  }

  /* ---------------- Admin ---------------- */

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http
      .get<ApiResponse<AdminDashboard>>(`${this.baseUrl}/admin/dashboard`)
      .pipe(this.unwrap<AdminDashboard>());
  }

  getModules(): Observable<ManagementModule[]> {
    return this.http
      .get<ApiResponse<{ modules: ManagementModule[] }>>(
        `${this.baseUrl}/admin/modules`
      )
      .pipe(map((res) => res.data.modules));
  }

  getReports(): Observable<ReportItem[]> {
    return this.http
      .get<ApiResponse<{ reports: ReportItem[] }>>(`${this.baseUrl}/admin/reports`)
      .pipe(map((res) => res.data.reports));
  }

  /** Every complaint in the society, with a status breakdown. */
  getAllComplaints(): Observable<{
    complaints: ComplaintItem[];
    summary: ComplaintSummary;
  }> {
    return this.http
      .get<
        ApiResponse<{ complaints: ComplaintItem[]; summary: ComplaintSummary }>
      >(`${this.baseUrl}/admin/complaints`)
      .pipe(this.unwrap<{ complaints: ComplaintItem[]; summary: ComplaintSummary }>());
  }

  updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    assignedTo?: string
  ): Observable<{ complaint: ComplaintItem }> {
    return this.http
      .post<ApiResponse<{ complaint: ComplaintItem }>>(
        `${this.baseUrl}/admin/complaints/${id}/status`,
        { status, assignedTo }
      )
      .pipe(this.unwrap<{ complaint: ComplaintItem }>());
  }

  /* ---------------- Resident ---------------- */

  getResidentDashboard(): Observable<ResidentDashboard> {
    return this.http
      .get<ApiResponse<ResidentDashboard>>(`${this.baseUrl}/resident/dashboard`)
      .pipe(this.unwrap<ResidentDashboard>());
  }

  getResidentBills(): Observable<ResidentBills> {
    return this.http
      .get<ApiResponse<ResidentBills>>(`${this.baseUrl}/resident/bills`)
      .pipe(this.unwrap<ResidentBills>());
  }

  payBill(flatNumber: string): Observable<{ bill: BillItem }> {
    return this.http
      .post<ApiResponse<{ bill: BillItem }>>(`${this.baseUrl}/resident/pay-bill`, {
        flatNumber,
      })
      .pipe(this.unwrap<{ bill: BillItem }>());
  }

  preApproveVisitor(payload: {
    name: string;
    phone: string;
    visitorType: string;
    destinationFlat: string;
  }): Observable<{ visitor: VisitorItem }> {
    return this.http
      .post<ApiResponse<{ visitor: VisitorItem }>>(
        `${this.baseUrl}/resident/pre-approve-visitor`,
        payload
      )
      .pipe(this.unwrap<{ visitor: VisitorItem }>());
  }

  /**
   * The caller's own complaints. `destinationFlat` is sent for shape only —
   * the server files the complaint against the flat on the token.
   */
  getResidentComplaints(): Observable<{ complaints: ComplaintItem[] }> {
    return this.http
      .get<ApiResponse<{ complaints: ComplaintItem[] }>>(
        `${this.baseUrl}/resident/complaints`
      )
      .pipe(this.unwrap<{ complaints: ComplaintItem[] }>());
  }

  createComplaint(payload: {
    title: string;
    category: ComplaintCategory;
    description: string;
    priority: ComplaintPriority;
  }): Observable<{ complaint: ComplaintItem }> {
    return this.http
      .post<ApiResponse<{ complaint: ComplaintItem }>>(
        `${this.baseUrl}/resident/complaints`,
        payload
      )
      .pipe(this.unwrap<{ complaint: ComplaintItem }>());
  }

  /* ---------------- Security ---------------- */

  getSecurityDashboard(): Observable<SecurityDashboard> {
    return this.http
      .get<ApiResponse<SecurityDashboard>>(`${this.baseUrl}/security/dashboard`)
      .pipe(this.unwrap<SecurityDashboard>());
  }

  checkInVisitor(payload: {
    name: string;
    phone: string;
    visitorType: string;
    destinationFlat: string;
    vehicleNumber?: string;
    otpCode?: string;
  }): Observable<{ visitor: VisitorItem }> {
    return this.http
      .post<ApiResponse<{ visitor: VisitorItem }>>(
        `${this.baseUrl}/security/check-in`,
        payload
      )
      .pipe(this.unwrap<{ visitor: VisitorItem }>());
  }

  markVisitorExit(visitorId: string): Observable<{ visitor: VisitorItem }> {
    return this.http
      .post<ApiResponse<{ visitor: VisitorItem }>>(
        `${this.baseUrl}/security/check-out/${visitorId}`,
        {}
      )
      .pipe(this.unwrap<{ visitor: VisitorItem }>());
  }

  /* ---------------- Committee ---------------- */

  getCommitteeDashboard(): Observable<CommitteeDashboard> {
    return this.http
      .get<ApiResponse<CommitteeDashboard>>(`${this.baseUrl}/committee/dashboard`)
      .pipe(this.unwrap<CommitteeDashboard>());
  }

  updateNOCStatus(
    id: string,
    status: "Approved" | "Rejected",
    reason?: string
  ): Observable<{ noc: NOCItem }> {
    return this.http
      .post<ApiResponse<{ noc: NOCItem }>>(
        `${this.baseUrl}/committee/noc/${id}/status`,
        { status, reason }
      )
      .pipe(this.unwrap<{ noc: NOCItem }>());
  }

  /* ---------------- Auth ---------------- */

  login(payload: {
    email: string;
    password: string;
    role: string;
  }): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(`${this.baseUrl}/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(this.unwrap<AuthSession>());
  }

  /** Trades the httpOnly refresh cookie for a new access token. */
  refresh(): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(
        `${this.baseUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(this.unwrap<AuthSession>());
  }

  logout(): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/auth/logout`,
      {},
      { withCredentials: true }
    );
  }
}
