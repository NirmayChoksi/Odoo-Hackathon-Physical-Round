import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  title = signal('SubSync UI Demo');
  navItems = signal([
    { label: 'Projects', active: true },
    { label: 'Blueprints' },
    { label: 'Compliance' }
  ]);
  
  // demo state
  demoCheckbox = signal(false);
  demoSelect = signal('');
  demoTextarea = signal('');
  demoToggle = signal(true);
}
