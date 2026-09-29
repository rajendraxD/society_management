import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular/lazy";
import { CommitteeComponent } from "./committee.component";
import { ComponentsModule } from "../../components/common/components.module";

const routes: Routes = [
  {
    path: "",
    component: CommitteeComponent,
  },
];

@NgModule({
  declarations: [CommitteeComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ComponentsModule,
  ],
})
export class CommitteeModule {}
