import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatFormFieldModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label *ngIf="label()">{{ label() }}</mat-label>
      <textarea 
        matInput
        [rows]="rows()"
        [placeholder]="placeholder()"
        [value]="value()"
        [disabled]="disabled()"
        [required]="required()"
        [maxLength]="maxLength()"
        class="resize-none"
        (input)="onInput($event)">
      </textarea>
      <mat-hint *ngIf="maxLength()" align="end">{{ value().length }} / {{ maxLength() }}</mat-hint>
      <mat-hint *ngIf="hint() && !error()" align="start">{{ hint() }}</mat-hint>
      <mat-error *ngIf="error()">{{ error() }}</mat-error>
    </mat-form-field>
  `
})
export class TextareaComponent {
  label = input('');
  placeholder = input('');
  value = input('');
  disabled = input(false);
  required = input(false);
  rows = input(4);
  maxLength = input<number | undefined>(undefined);
  error = input<string | null>(null);
  hint = input<string | null>(null);

  valueChange = output<string>();

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }
}
