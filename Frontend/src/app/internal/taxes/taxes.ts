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
    { label: 'Subscriptions', active: false },
    { label: 'Products', active: false },
    { label: 'Reporting', active: false },
    { label: 'Users/Contacts', active: false },
    { label: 'Taxes', active: true }
  ]);

  // Form State
  taxName = signal<string>('');
  taxComputation = signal<string>('Percentage');
  amount = signal<number | null>(null);

  computationTypes = ['Percentage', 'Fixed Price'];

  onNew() {
    alert('Create New Tax');
  }

  onDelete() {
    alert('Delete Tax');
  }

  onSave() {
    alert('Save Tax');
  }

  onNavClick(item: any) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }
}
