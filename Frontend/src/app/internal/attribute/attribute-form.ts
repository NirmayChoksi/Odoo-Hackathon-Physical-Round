import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';

@Component({
  selector: 'app-attribute-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './attribute-form.html',
  styleUrl: './attribute-form.css'
})
export class AttributeFormComponent {

  // Navigation State
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
    { label: 'Users/Contacts', active: false, path: SUBSCRIPTION_APP_PATHS.users },
    {
      label: 'Configuration',
      active: true,
      isDropdown: true,
      dropdownItems: [
        { label: 'Overview', path: SUBSCRIPTION_APP_PATHS.configuration },
        { label: 'Attribute', path: SUBSCRIPTION_APP_PATHS.attribute },
        { label: 'Recurring Plan', path: SUBSCRIPTION_APP_PATHS.recurringPlan },
        { label: 'Quotation Template', path: SUBSCRIPTION_APP_PATHS.quotationTemplate },
        { label: 'Payment term', path: SUBSCRIPTION_APP_PATHS.paymentTerm },
        { label: 'Discount', path: SUBSCRIPTION_APP_PATHS.discount },
        { label: 'Taxes', path: SUBSCRIPTION_APP_PATHS.taxes },
      ],
    },
  ]);

  // Form State
  attributeName = signal<string>('');
  isConfigOpen = signal(false);
  
  // Table Data
  attributeValues = signal([
    { value: 'odoo', extraPrice: '20 R.s' },
    { value: '', extraPrice: '' }
  ]);

  constructor(private route: ActivatedRoute) {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.attributeName.set('Brand'); // Mock data
    }

    window.addEventListener('click', () => {
      this.isConfigOpen.set(false);
    });
  }

  onNew() {
    alert('Create New Attribute');
  }

  onDelete() {
    alert('Delete Attribute');
  }

  onSave() {
    alert('Save Attribute');
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  toggleConfig(event: Event) {
    event.stopPropagation();
    this.isConfigOpen.set(!this.isConfigOpen());
  }

  addValueRow() {
    this.attributeValues.set([...this.attributeValues(), { value: '', extraPrice: '' }]);
  }
}
