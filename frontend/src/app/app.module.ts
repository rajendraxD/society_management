import { NgModule, provideZoneChangeDetection } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { RouteReuseStrategy } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { IonicModule, IonicRouteStrategy } from "@ionic/angular/lazy";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    // Angular 21+ bootstraps zoneless by default, where assigning a field inside
    // an RxJS subscribe() schedules no change detection — dashboards would load
    // data yet render zeros until something else triggered a render. These
    // components are written in the classic zone style, so opt back into it.
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
