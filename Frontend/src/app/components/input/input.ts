import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label *ngIf="label()">{{ label() }}</mat-label>
      
      <mat-icon *ngIf="prefixIcon()" matPrefix class="mr-2">{{ prefixIcon() }}</mat-icon>
      
      <input 
        matInput
        [type]="isPasswordVisible ? 'text' : type()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [required]="required()"
        (input)="onInput($event)">

      <button *ngIf="type() === 'password'" mat-icon-button matSuffix (click)="togglePasswordVisibility()" type="button">
        <mat-icon>{{ isPasswordVisible ? 'visibility_off' : 'visibility' }}</mat-icon>
      </button>

      <mat-icon *ngIf="suffixIcon() && type() !== 'password'" matSuffix>{{ suffixIcon() }}</mat-icon>

      <mat-hint *ngIf="hint() && !error()">{{ hint() }}</mat-hint>
      <mat-error *ngIf="error()">{{ error() }}</mat-error>
    </mat-form-field>
  `
})
export class InputComponent {
  label = input('');
  type = input<'text' | 'password' | 'email' | 'number'>('text');
  placeholder = input('');
  value = input('');
  disabled = input(false);
  required = input(false);
  error = input<string | null>(null);
  hint = input<string | null>(null);
  prefixIcon = input<string | null>(null);
  suffixIcon = input<string | null>(null);
  
  autoFocus = input(false);

  valueChange = output<string>();

  isPasswordVisible = false;

  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
