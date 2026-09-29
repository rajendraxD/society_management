import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular/lazy";
import { ResidentComponent } from "./resident.component";
import { ComponentsModule } from "../../components/common/components.module";

const routes: Routes = [
  {
    path: "",
    component: ResidentComponent,
  },
];

@NgModule({
  declarations: [ResidentComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ComponentsModule,
  ],
})
export class ResidentModule {}
