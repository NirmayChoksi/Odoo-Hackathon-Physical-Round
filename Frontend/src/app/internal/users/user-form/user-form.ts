import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
})
export class UserFormComponent {
  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  address1 = signal('');
  address2 = signal('');
  address3 = signal('');
  relatedContact = signal('');

  constructor(private router: Router) {}

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
