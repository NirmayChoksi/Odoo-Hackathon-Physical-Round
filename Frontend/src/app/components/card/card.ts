import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card [class]="computedClasses()">
      <mat-card-header *ngIf="header() || subtitle()">
        <mat-card-title *ngIf="header()" class="!font-['Epilogue'] !text-primary !text-xl !font-semibold !tracking-tight">{{ header() }}</mat-card-title>
        <mat-card-subtitle *ngIf="subtitle()" class="!text-on-surface-variant">{{ subtitle() }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content class="!pt-4">
        <ng-content></ng-content>
      </mat-card-content>

      <mat-card-actions *ngIf="hasFooter()" align="end">
        <ng-content select="[footer]"></ng-content>
      </mat-card-actions>
    </mat-card>
  `
})
export class CardComponent {
  variant = input<CardVariant>('default');
  header = input('');
  subtitle = input('');
  hasFooter = input(false);

  computedClasses = computed(() => {
    let base = 'transition-all duration-300 ';
    
    switch (this.variant()) {
      case 'default':
        base += '!bg-surface-container-low !text-on-surface !shadow-none !border-none !rounded-xl';
        break;
      case 'elevated':
        base += '!bg-surface-container-low !shadow-lg !border-none !rounded-xl';
        break;
      case 'outlined':
        base += '!bg-transparent !border !border-outline-variant/30 !rounded-xl !shadow-none';
        break;
      case 'glass':
        base += '!bg-surface-bright/80 !backdrop-blur-xl !border !border-outline-variant/10 !shadow-[0_20px_40px_rgba(0,0,0,0.4)] !rounded-xl';
        break;
    }
    
    return base;
  });
}
