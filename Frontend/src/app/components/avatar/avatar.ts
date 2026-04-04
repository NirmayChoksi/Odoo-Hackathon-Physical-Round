import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="wrapperClasses()" [title]="name()">
      @if (src()) {
        <img
          [src]="src()"
          [alt]="name()"
          class="w-full h-full object-cover"
          (error)="onImageError()"
        />
      } @else {
        <span [class]="initialsClasses()">{{ initials() }}</span>
      }

      @if (status()) {
        <span [class]="statusClasses()"></span>
      }
    </div>
  `,
})
export class AvatarComponent {
  src = input<string>('');
  name = input<string>('');
  size = input<AvatarSize>('md');
  status = input<'online' | 'offline' | 'away' | ''>('');
  rounded = input<boolean>(true);

  protected imageError = false;

  onImageError() {
    this.imageError = true;
  }

  initials = computed(() => {
    const n = this.name();
    if (!n) return '?';
    const parts = n.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : n.slice(0, 2).toUpperCase();
  });

  wrapperClasses = computed(() => {
    const sizes: Record<AvatarSize, string> = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-14 h-14',
      xl: 'w-20 h-20',
    };
    const rounded = this.rounded() ? 'rounded-full' : 'rounded-xl';
    return `relative inline-flex items-center justify-center overflow-hidden bg-[#dae3f2] shrink-0 ${sizes[this.size()]} ${rounded}`;
  });

  initialsClasses = computed(() => {
    const sizes: Record<AvatarSize, string> = {
      xs: 'text-[8px]',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-lg',
      xl: 'text-2xl',
    };
    return `font-semibold text-[#051125] select-none ${sizes[this.size()]}`;
  });

  statusClasses = computed(() => {
    const colors: Record<string, string> = {
      online:  'bg-emerald-500',
      offline: 'bg-[#75777d]',
      away:    'bg-amber-500',
    };
    const sizes: Record<AvatarSize, string> = {
      xs: 'w-1.5 h-1.5 border',
      sm: 'w-2 h-2 border',
      md: 'w-2.5 h-2.5 border-2',
      lg: 'w-3 h-3 border-2',
      xl: 'w-4 h-4 border-2',
    };
    const color = colors[this.status()] ?? 'bg-[#75777d]';
    return `absolute bottom-0 right-0 rounded-full border-white ${color} ${sizes[this.size()]}`;
  });
}
