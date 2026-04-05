import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label *ngIf="label()">{{ label() }}</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        (selectionChange)="onChange($event.value)">
        <mat-option *ngIf="placeholder() && !value()" [value]="null" disabled>{{ placeholder() }}</mat-option>
        <mat-option *ngFor="let option of options()" [value]="option.value" [disabled]="option.disabled">
          {{ option.label }}
        </mat-option>
      </mat-select>
      <mat-hint *ngIf="hint() && !error()">{{ hint() }}</mat-hint>
      <mat-error *ngIf="error()">{{ error() }}</mat-error>
    </mat-form-field>
  `
})
export class SelectComponent {
  label = input('');
  options = input<SelectOption[]>([]);
  value = input<string | number | null>(null);
  placeholder = input('Select an option');
  disabled = input(false);
  error = input<string | null>(null);
  hint = input<string | null>(null);

  valueChange = output<string | number>();

  onChange(val: string | number) {
    this.valueChange.emit(val);
  }
}
