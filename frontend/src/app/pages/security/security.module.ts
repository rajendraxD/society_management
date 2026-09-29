import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular/lazy";
import { SecurityComponent } from "./security.component";
import { ComponentsModule } from "../../components/common/components.module";

const routes: Routes = [
  {
    path: "",
    component: SecurityComponent,
  },
];

@NgModule({
  declarations: [SecurityComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ComponentsModule,
  ],
})
export class SecurityModule {}
