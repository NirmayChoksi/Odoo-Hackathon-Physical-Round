import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    // Keep the single app icon screen for 3 seconds
    setTimeout(() => {
      // For now, route back to login, or you can route to
      // your actual web application home page once built.
      this.router.navigate(['/subscriptions']);
    }, 3000);
  }
}
