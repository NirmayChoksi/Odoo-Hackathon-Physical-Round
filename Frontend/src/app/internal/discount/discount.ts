import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-discount',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule
  ],
  templateUrl: './discount.html',
  styleUrl: './discount.css'
})
export class DiscountComponent {
  
  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false },
    { label: 'Discount', active: true },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Configuration', active: false }
  ]);

  // Form State
  discountName = signal<string>('');
  discountType = signal<string>('Percentage');
  minimumPurchase = signal<number | null>(null);
  minimumQuantity = signal<number | null>(null);
  products = signal<string>('');
  
  startDate = signal<string>('');
  endDate = signal<string>('');
  limitUsage = signal<boolean>(false);
  limitUsageCount = signal<number | null>(null);

  discountTypes = ['Fixed Price', 'Percentage'];

  onNew() {
    alert('Create New Discount');
  }

  onDelete() {
    alert('Delete Discount');
  }

  onSave() {
    alert('Save Discount');
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
