import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-taxes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './taxes.html',
  styleUrl: './taxes.css'
})
export class TaxesComponent {

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
  taxName = signal<string>('');
  taxComputation = signal<string>('Percentage');
  amount = signal<number | null>(null);

  computationTypes = ['Percentage', 'Fixed Price'];

  isConfigOpen = signal(false);

  onNew() {
    alert('Create New Tax');
  }

  onDelete() {
    alert('Delete Tax');
  }

  onSave() {
    alert('Save Tax');
  }

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
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
