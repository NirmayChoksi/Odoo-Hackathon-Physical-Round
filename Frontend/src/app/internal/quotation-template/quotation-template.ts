import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Import Reusable Components
import { NavbarComponent, NavItem } from '../../components/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';
import { SelectComponent, SelectOption } from '../../components/select/select';
import { CheckboxComponent } from '../../components/checkbox/checkbox';

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
    FormsModule,
    NavbarComponent,
    ButtonComponent,
    InputComponent,
    SelectComponent,
    CheckboxComponent
  ],
  templateUrl: './quotation-template.html',
  styleUrl: './quotation-template.css'
})
export class QuotationTemplateComponent {
  
  // Navigation State
  navItems = signal<NavItem[]>([
    { label: 'Subscriptions', active: false },
    { label: 'Products', active: false },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Quotation Template', active: true }
  ]);

  // Form State
  validityDays = signal<number>(15);
  recurringPlan = signal<string>('');
  lastForever = signal<boolean>(false);
  endAfterAmount = signal<number>(1);
  endAfterUnit = signal<string>('Month');

  timeUnitOptions = signal<SelectOption[]>([
    { value: 'Week', label: 'Week' },
    { value: 'Month', label: 'Month' },
    { value: 'Year', label: 'Year' }
  ]);

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

  onNavClick(item: NavItem) {
    // Basic stub for nav clicks
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
