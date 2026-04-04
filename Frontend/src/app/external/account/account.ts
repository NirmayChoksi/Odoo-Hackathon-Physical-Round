import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../shared/navbar/navbar';
import { ButtonComponent } from '../../components/button/button';
import { InputComponent } from '../../components/input/input';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ButtonComponent, InputComponent, RouterModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class AccountComponent {
  
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

