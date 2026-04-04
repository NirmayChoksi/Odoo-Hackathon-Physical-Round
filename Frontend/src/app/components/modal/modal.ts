import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Note: While Angular Material provides MatDialog, it is typically used via a Service.
 * To maintain the declarative API of the UI Kit (<app-modal [open]="..."/>),
 * we keep the custom declarative structure but utilize Material classes/shadows where applicable
 * and remain styled to the SubSync UI design system.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open()" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-[#000d29]/80 backdrop-blur-sm transition-opacity" 
        (click)="onBackdropClick()"
      ></div>

      <!-- Modal Panel -->
      <div 
        class="relative bg-surface-bright/95 backdrop-blur-xl rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-outline-variant/10 flex flex-col max-h-full overflow-hidden transform transition-all"
        [class]="sizeClasses()"
      >
        
        <!-- Header -->
        <div *ngIf="title() || hasHeaderContent()" class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
          <div>
            <h3 *ngIf="title()" class="text-[1.5rem] font-bold tracking-tight text-on-surface" id="modal-title">{{ title() }}</h3>
            <p *ngIf="description()" class="text-sm text-on-surface-variant mt-1">{{ description() }}</p>
          </div>
          <ng-content select="[header]"></ng-content>
          
          <button *ngIf="showClose()" (click)="close()" class="text-outline-variant hover:text-primary transition-colors p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 ml-4">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 overflow-y-auto">
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        <div *ngIf="hasFooterContent()" class="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low/50">
          <ng-content select="[footer]"></ng-content>
        </div>

      </div>
    </div>
  `
})
export class ModalComponent {
  open = input(false);
  title = input('');
  description = input('');
  size = input<ModalSize>('md');
  showClose = input(true);
  closeOnBackdrop = input(true);

  openChange = output<boolean>();

  sizeClasses = computed(() => {
    switch(this.size()) {
      case 'sm': return 'w-full sm:max-w-md';
      case 'md': return 'w-full sm:max-w-lg';
      case 'lg': return 'w-full sm:max-w-2xl';
      case 'xl': return 'w-full sm:max-w-4xl';
      case 'full': return 'w-full h-full max-h-screen rounded-none border-none';
      default: return 'w-full sm:max-w-lg';
    }
  });

  // These could be implemented with ViewChild checking if content exists, 
  // but for simplicity we rely on the projected content slots.
  hasHeaderContent() { return true; }
  hasFooterContent() { return true; }

  close() {
    this.openChange.emit(false);
  }

  onBackdropClick() {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }
}
