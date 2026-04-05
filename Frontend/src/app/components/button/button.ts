import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <ng-container [ngSwitch]="variant()">
      <button *ngSwitchCase="'primary'" mat-flat-button color="primary" [disabled]="disabled() || loading()" [class]="customClasses()">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>

      <button *ngSwitchCase="'secondary'" mat-flat-button color="accent" [disabled]="disabled() || loading()" [class]="customClasses()">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>

      <button *ngSwitchCase="'danger'" mat-flat-button color="warn" [disabled]="disabled() || loading()" [class]="customClasses()">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>

      <button *ngSwitchCase="'ghost'" mat-button [disabled]="disabled() || loading()" [class]="customClasses()">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>

      <button *ngSwitchDefault mat-stroked-button color="primary" [disabled]="disabled() || loading()" [class]="customClasses()">
        <ng-container *ngTemplateOutlet="content"></ng-container>
      </button>
    </ng-container>

    <ng-template #content>
      <div class="flex items-center justify-center gap-2">
        <mat-spinner *ngIf="loading()" [diameter]="spinnerSize()" color="accent"></mat-spinner>
        <span *ngIf="!loading() && icon() && iconPosition() === 'left'" class="material-symbols-outlined">{{ icon() }}</span>
        <ng-content></ng-content>
        <span *ngIf="label()">{{ label() }}</span>
        <span *ngIf="!loading() && icon() && iconPosition() === 'right'" class="material-symbols-outlined">{{ icon() }}</span>
      </div>
    </ng-template>
  `
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  loading = input(false);
  label = input('');
  icon = input('');
  iconPosition = input<'left' | 'right'>('left');
  fullWidth = input(false);

  spinnerSize = computed(() => {
    switch (this.size()) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  });

  customClasses = computed(() => {
    let classes = 'font-bold tracking-wide transition-all duration-200 ';
    switch (this.size()) {
      case 'sm': classes += '!px-4 !py-1 !text-sm '; break;
      case 'lg': classes += '!px-8 !py-3 !text-lg '; break;
      default: classes += '!px-6 !py-2 '; break;
    }
    if (this.fullWidth()) classes += '!w-full ';
    return classes;
  });
}
