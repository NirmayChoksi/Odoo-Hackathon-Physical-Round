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
  `,
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('md');
  label = input('');
  dot = input(false);

  dotColor = computed(() => {
    switch (this.variant()) {
      case 'success':
        return 'bg-[#19305c] ring-1 ring-[#ae7dac]/40';
      case 'warning':
        return 'bg-[#f1916d]';
      case 'error':
        return 'bg-[#f1916d] opacity-90';
      case 'info':
        return 'bg-[#ae7dac]';
      default:
        return 'bg-[#413b61]';
    }
  });

  computedClasses = computed(() => {
    let classes = '!font-bold !tracking-wide uppercase !rounded-full ';

    switch (this.size()) {
      case 'sm':
        classes += '!text-[0.65rem] !px-2 !min-h-[20px] ';
        break;
      case 'lg':
        classes += '!text-sm !px-4 !min-h-[32px] ';
        break;
      default:
        classes += '!text-xs !px-3 !min-h-[24px] ';
        break;
    }

    switch (this.variant()) {
      case 'default':
        classes += '!bg-[#413b61]/90 !text-[#f3dadf] border border-[#ae7dac]/25 ';
        break;
      case 'success':
        classes += '!bg-[#19305c]/85 !text-[#f3dadf] border border-[#ae7dac]/30 ';
        break;
      case 'warning':
        classes += '!bg-[#f1916d]/18 !text-[#f1916d] border border-[#f1916d]/35 ';
        break;
      case 'error':
        classes += '!bg-[#f1916d]/22 !text-[#f3dadf] border border-[#f1916d]/45 ';
        break;
      case 'info':
        classes += '!bg-[#ae7dac]/16 !text-[#ae7dac] border border-[#ae7dac]/35 ';
        break;
      case 'outline':
        classes += '!bg-transparent border border-[#ae7dac]/45 !text-[#ae7dac] ';
        break;
    }

    return classes;
  });
}
