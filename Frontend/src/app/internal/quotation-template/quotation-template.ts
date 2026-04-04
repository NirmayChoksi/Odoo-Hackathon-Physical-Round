import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface QuotationProduct {
  id: string;
  product: string;
  description: string;
  quantity: number;
}

@Component({
  selector: 'app-quotation-template',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    FormsModule
  ],
  templateUrl: './quotation-template.html',
  styleUrl: './quotation-template.css'
})
export class QuotationTemplateComponent {
  
  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: '/subscriptions' },
    { label: 'Products', active: false, path: '/products' },
    { label: 'Reporting', active: false, path: '/reporting' },
    { label: 'Users/Contacts', active: false, path: '/users' },
    { 
      label: 'Configuration', 
      active: true, 
      isDropdown: true,
      dropdownItems: [
        { label: 'Overview', path: '/configuration' },
        { label: 'Attribute', path: '/attribute' },
        { label: 'Recurring Plan', path: '/recurring-plan' },
        { label: 'Quotation Template', path: '/quotation-template' },
        { label: 'Payment term', path: '/payment-term' },
        { label: 'Discount', path: '/discount' },
        { label: 'Taxes', path: '/taxes' }
      ]
    }
  ]);

  // Form State
  validityDays = signal<number>(15);
  recurringPlan = signal<string>('');
  lastForever = signal<boolean>(false);
  endAfterAmount = signal<number>(1);
  endAfterUnit = signal<string>('Month');

  timeUnits = ['Week', 'Month', 'Year'];

  products = signal<QuotationProduct[]>([
    { id: '1', product: 'demo', description: 'Demo product', quantity: 1 }
  ]);

  onNew() {
    alert('Feature coming soon: Create New');
  }

  onDelete() {
    alert('Feature coming soon: Delete Quotation Template');
  }

  onSave() {
    alert('Save quotation template.');
  }

  isConfigOpen = signal(false);

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  constructor() {
    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onNavClick(item: any) {
    // Basic stub for nav clicks
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
