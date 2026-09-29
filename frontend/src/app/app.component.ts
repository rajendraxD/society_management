import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
  // Angular 22 defaults components to OnPush, and this is the only view
  // ApplicationRef holds. Left OnPush, a tick would stop here and never
  // descend into the routed page — data would load and never render.
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AppComponent {
  constructor() {}
}
