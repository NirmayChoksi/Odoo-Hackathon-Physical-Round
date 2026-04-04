import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../../subscription-app.constants';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserFormComponent {
  navItems = signal([
    { label: 'Subscriptions', active: false, path: SUBSCRIPTION_APP_PATHS.subscriptions },
    { label: 'Products', active: false, path: SUBSCRIPTION_APP_PATHS.products },
    { label: 'Reporting', active: false, path: SUBSCRIPTION_APP_PATHS.reporting },
    { label: 'Users/Contacts', active: true, path: SUBSCRIPTION_APP_PATHS.users,
      isDropdown: true,
      dropdownItems: [...USERS_CONTACTS_DROPDOWN_ITEMS],
    },
    {
      label: 'Configuration',
      active: false,
      isDropdown: true,
      dropdownItems: [...CONFIGURATION_DROPDOWN_ITEMS],
    },
  ]);

  navDropdownOpenKey = signal<string | null>(null);

  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  address1 = signal('');
  address2 = signal('');
  address3 = signal('');
  relatedContact = signal('');

  constructor(private router: Router) {
    window.addEventListener('click', () => this.navDropdownOpenKey.set(null));
  }

  toggleNavDropdown(event: Event, label: string) {
    event.stopPropagation();
    this.navDropdownOpenKey.update((k) => (k === label ? null : label));
  }

  onNavClick(item: { label: string }) {
    const items = this.navItems().map(i => ({ ...i, active: i.label === item.label }));
    this.navItems.set(items);
  }

  onNew() {
    this.name.set('');
    this.email.set('');
    this.phone.set('');
    this.address1.set('');
    this.address2.set('');
    this.address3.set('');
    this.relatedContact.set('');
  }

  onSave() {
    if (!this.name() || !this.email()) {
      alert('Please fill in at least Name and Email.');
      return;
    }
    alert('User saved successfully!');
  }

  onDelete() {
    if (!this.name()) {
      alert('No user to delete.');
      return;
    }
    if (confirm(`Delete user "${this.name()}"?`)) {
      this.onNew();
    }
  }

  onChangePassword() {
    if (!this.name()) {
      alert('Save the user first before changing the password.');
      return;
    }
    const pw = prompt(`Set new password for "${this.name()}":`);
    if (pw) alert('Password updated!');
  }
}
