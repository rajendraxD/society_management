import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular/lazy";
import { RoleSelectComponent } from "./role-select.component";

const routes: Routes = [
  {
    path: "",
    component: RoleSelectComponent,
  },
];

@NgModule({
  declarations: [RoleSelectComponent],
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
})
export class RoleSelectModule {}
