import { Component, EventEmitter, Input, Output } from "@angular/core";
import { UserRole } from "../../../core/models/society.models";

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  iconActive: string;
}

/**
 * Fixed bottom navigation shared by all four role portals.
 * The active colour follows the role accent so each portal keeps its identity.
 */
@Component({
  selector: "app-bottom-tabs",
  templateUrl: "./bottom-tabs.component.html",
  styleUrls: ["./bottom-tabs.component.scss"],
  standalone: false,
})
export class BottomTabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab = "";
  @Input() role: UserRole = "admin";

  @Output() tabChange = new EventEmitter<string>();

  select(tabId: string) {
    if (tabId !== this.activeTab) {
      this.tabChange.emit(tabId);
    }
  }
}
