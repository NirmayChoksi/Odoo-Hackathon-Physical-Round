import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule, MatIconModule],
  template: `
    <mat-chip [class]="computedClasses()">
      <div class="flex items-center gap-2">
        <span *ngIf="dot()" class="w-2 h-2 rounded-full" [class]="dotColor()"></span>
        <ng-content></ng-content>
        <span *ngIf="label()">{{ label() }}</span>
      </div>
    </mat-chip>
  `
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('md');
  label = input('');
  dot = input(false);

  dotColor = computed(() => {
    switch (this.variant()) {
      case 'success': return 'bg-green-400';
      case 'warning': return 'bg-yellow-400';
      case 'error': return 'bg-[#f1916d]';
      case 'info': return 'bg-blue-400';
      default: return 'bg-primary';
    }
  });

  computedClasses = computed(() => {
    // Basic size logic
    let classes = '!font-bold !tracking-wide uppercase !rounded-full ';
    
    switch (this.size()) {
      case 'sm': classes += '!text-[0.65rem] !px-2 !min-h-[20px] '; break;
      case 'lg': classes += '!text-sm !px-4 !min-h-[32px] '; break;
      default: classes += '!text-xs !px-3 !min-h-[24px] '; break;
    }

    // Colors mapping to Subsync dark palette
    switch (this.variant()) {
      case 'default':
        classes += '!bg-surface-container-highest !text-on-surface ';
        break;
      case 'success':
        classes += '!bg-green-400/10 !text-green-400 border !border-green-400/20 ';
        break;
      case 'warning':
        classes += '!bg-yellow-400/10 !text-yellow-400 border !border-yellow-400/20 ';
        break;
      case 'error':
        classes += '!bg-[#f1916d]/15 !text-[#f1916d] border !border-[#f1916d]/35 ';
        break;
      case 'info':
        classes += '!bg-blue-400/10 !text-blue-400 border !border-blue-400/20 ';
        break;
      case 'outline':
        classes += '!bg-transparent border !border-outline !text-outline ';
        break;
    }

    return classes;
  });
}
