import {
  Component,
  signal,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div class="cd-backdrop" (click)="onCancel()"></div>

      <!-- Dialog panel -->
      <div class="cd-panel" role="alertdialog"
           [attr.aria-labelledby]="'cd-title-' + uid"
           [attr.aria-describedby]="'cd-desc-' + uid"
           aria-modal="true">

        <!-- Icon circle -->
        <div class="cd-icon cd-icon--{{ variant() }}">
          <span class="material-symbols-outlined">{{ iconName() }}</span>
        </div>

        <!-- Text -->
        <h2 class="cd-title" [id]="'cd-title-' + uid">{{ title() }}</h2>
        <p  class="cd-desc"  [id]="'cd-desc-' + uid">{{ message() }}</p>

        <!-- Actions -->
        <div class="cd-actions">
          <button class="cd-btn cd-btn--cancel" (click)="onCancel()">
            {{ cancelLabel() }}
          </button>
          <button
            class="cd-btn cd-btn--confirm cd-btn--{{ variant() }}"
            (click)="onConfirm()"
            [disabled]="busy()">
            <span class="material-symbols-outlined cd-btn-icon">
              {{ busy() ? 'hourglass_empty' : confirmIcon() }}
            </span>
            {{ busy() ? 'Please wait…' : confirmLabel() }}
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialogComponent {
  readonly uid = Math.random().toString(36).slice(2, 8);

  // Inputs
  open         = input(false);
  title        = input('Are you sure?');
  message      = input('This action cannot be undone.');
  confirmLabel = input('Confirm');
  cancelLabel  = input('Cancel');
  confirmIcon  = input('check');
  variant      = input<'danger' | 'warning' | 'primary'>('danger');
  busy         = input(false);

  // Outputs
  confirmed = output<void>();
  cancelled = output<void>();

  iconName() {
    const map: Record<string, string> = {
      danger:  'delete_forever',
      warning: 'warning',
      primary: 'info',
    };
    return map[this.variant()] ?? 'help';
  }

  onConfirm() { this.confirmed.emit(); }
  onCancel()  { this.cancelled.emit(); }
}
