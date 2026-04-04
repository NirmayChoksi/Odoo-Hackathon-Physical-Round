import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recurring-plan',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './recurring-plan.html',
  styleUrl: './recurring-plan.css'
})
export class RecurringPlanComponent {

  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false },
    { label: 'Products', active: false },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Recurring Plan', active: true }
  ]);

  // Form State
  planName = signal<string>('');
  billingValue = signal<number | null>(null);
  billingUnit = signal<string>('Month');
  autoCloseDays = signal<number | null>(null);
  
  closable = signal<boolean>(false);
  pausable = signal<boolean>(false);
  renew = signal<boolean>(false);

  units = ['Weeks', 'Month', 'Year'];

  // Table Data
  products = signal([
    { product: 'demo', variant: '', price: 'eg. 4 rs per week', minQty: '1 qty' }
  ]);

  onNew() {
    alert('Create New Plan');
  }

  onDelete() {
    alert('Delete Plan');
  }

  onSave() {
    alert('Save Plan');
  }

  onSubscriptionClick() {
    alert('View Linked Subscriptions');
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  addProductRow() {
    this.products.set([...this.products(), { product: '', variant: '', price: '', minQty: '' }]);
  }
}
