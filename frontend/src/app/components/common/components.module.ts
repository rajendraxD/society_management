import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular/lazy";

import { BottomTabsComponent } from "./bottom-tabs/bottom-tabs.component";

/**
 * Shared presentational components used across more than one role portal.
 * Imported by each feature module that needs them.
 */
@NgModule({
  declarations: [BottomTabsComponent],
  imports: [CommonModule, IonicModule],
  exports: [BottomTabsComponent],
})
export class ComponentsModule {}
