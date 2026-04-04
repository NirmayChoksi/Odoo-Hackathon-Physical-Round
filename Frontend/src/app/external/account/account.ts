import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';
import { RouterModule } from '@angular/router';
import { ecommerceCommands } from '../ecommerce-navigation';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, InputComponent, RouterModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent {
  private route = inject(ActivatedRoute);
  readonly navLinkBase = this.route.snapshot.data['navLinkBase'] as string | undefined;
  readonly ordersCmd = ecommerceCommands(this.navLinkBase, 'orders');

  isEditing = signal(false);

  // Mock User Data
  user = signal({
    name: 'Rohit Sharma',
    email: 'rohit.sharma@example.com',
    phone: '+91 98765 43210',
    address: '123 Odoo Street, Hackathon City, India',
    otherDetails: 'Joined SubSync early adopter program.'
  });

  // Edit Buffer
  editBuffer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    otherDetails: ''
  };

  toggleEdit() {
    if (!this.isEditing()) {
      // Enter Edit Mode - clone data
      this.editBuffer = { ...this.user() };
    }
    this.isEditing.set(!this.isEditing());
  }

  save() {
    this.user.set({ ...this.editBuffer });
    this.isEditing.set(false);
  }

  updateField(field: keyof typeof this.editBuffer, val: string) {
    this.editBuffer[field] = val;
  }
}

