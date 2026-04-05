import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule],
  template: `
    <div class="flex flex-col">
      <mat-checkbox 
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [disabled]="disabled()"
        (change)="onChange($event.checked)"
        color="primary">
        <span class="text-sm font-semibold text-on-surface hover:text-primary transition-colors">
          <ng-content></ng-content>
          <span *ngIf="label()">{{ label() }}</span>
        </span>
      </mat-checkbox>
      <p *ngIf="description()" class="text-xs text-on-surface-variant ml-8 mt-1">{{ description() }}</p>
    </div>
  `
})
export class CheckboxComponent {
  label = input('');
  description = input('');
  checked = input(false);
  indeterminate = input(false);
  disabled = input(false);

  checkedChange = output<boolean>();

  onChange(checked: boolean) {
    this.checkedChange.emit(checked);
  }
}
