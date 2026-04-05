import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS, subscriptionPaymentTermFormPath } from '../subscription-app.constants';
import { PaymentTermStore } from './payment-term.store';

@Component({
  selector: 'app-payment-term-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './payment-term-list.html',
  styleUrl: './payment-term-list.css',
})
export class PaymentTermListComponent implements OnInit {
  readonly store = inject(PaymentTermStore);
  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly formPath = subscriptionPaymentTermFormPath;

  searchQuery = signal('');

  async ngOnInit(): Promise<void> {
    await this.store.refreshList();
  }

  filteredTerms() {
    const q = this.searchQuery().trim().toLowerCase();
    const rows = this.store.termsList();
    if (!q) return rows;
    return rows.filter(
      (t) =>
        t.termName.toLowerCase().includes(q) ||
        String(t.dueType).toLowerCase().includes(q) ||
        String(t.status).toLowerCase().includes(q),
    );
  }
}
