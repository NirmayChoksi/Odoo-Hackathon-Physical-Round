import { Component } from '@angular/core';
import { SubscriptionsComponent } from '../../../internal/subscriptions/subscriptions';

@Component({
  selector: 'app-internal-subscriptions-page',
  standalone: true,
  imports: [SubscriptionsComponent],
  template: `<app-subscriptions />`,
})
export class InternalSubscriptionsPageComponent {}
