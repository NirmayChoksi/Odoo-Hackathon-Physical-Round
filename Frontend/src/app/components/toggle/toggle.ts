import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, MatSlideToggleModule],
  template: `
    <div class="flex flex-col">
      <mat-slide-toggle 
        color="primary"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="onChange($event.checked)">
        <span class="text-sm font-semibold text-on-surface hover:text-primary transition-colors">
          <ng-content></ng-content>
          <span *ngIf="label()">{{ label() }}</span>
        </span>
      </mat-slide-toggle>
      <p *ngIf="description()" class="text-xs text-on-surface-variant ml-12 mt-1">{{ description() }}</p>
    </div>
  `
})
export class ToggleComponent {
  label = input('');
  description = input('');
  checked = input(false);
  disabled = input(false);

  checkedChange = output<boolean>();

  onChange(checked: boolean) {
    this.checkedChange.emit(checked);
  }
}
