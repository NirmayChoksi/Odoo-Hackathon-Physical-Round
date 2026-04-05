import {
  Component,
  signal,
  input,
  output,
  inject,
  OnDestroy,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, takeUntil } from 'rxjs';

const CUST_API = '/api/internal/customers';

export interface CustomerOption {
  customer_id: number;
  customer_name: string;
  email: string | null;
  company_name: string | null;
}

@Component({
  selector: 'app-customer-typeahead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cta-wrap" #wrap>
      <!-- Input -->
      <div class="cta-input-box" [class.cta-input-box--focused]="open()">
        <span class="material-symbols-outlined cta-icon">person_search</span>
        <input
          #inputEl
          type="text"
          class="cta-input"
          [placeholder]="disabled() ? selectedLabel() || 'No customer' : 'Search by name or email…'"
          [disabled]="disabled()"
          [value]="query()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (keydown)="onKey($event)"
          autocomplete="off"
          role="combobox"
          [attr.aria-expanded]="open()"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-owns="cta-listbox"
          id="sf-customer" />
        <!-- Clear button -->
        @if (selectedId() && !disabled()) {
          <button type="button" class="cta-clear" (click)="clearSelection()" title="Clear selection">
            <span class="material-symbols-outlined">close</span>
          </button>
        }
        <!-- Spinner -->
        @if (loading()) {
          <span class="cta-spinner"></span>
        }
      </div>

      <!-- Dropdown -->
      @if (open() && !disabled()) {
        <ul class="cta-list" role="listbox" id="cta-listbox" (mousedown)="$event.preventDefault()">
          <!-- Results -->
          @for (c of results(); track c.customer_id; let i = $index) {
            <li
              class="cta-item"
              [class.cta-item--highlighted]="highlightIdx() === i"
              role="option"
              [attr.aria-selected]="selectedId() === String(c.customer_id)"
              (click)="select(c)">
              <span class="cta-item__icon material-symbols-outlined">person</span>
              <span class="cta-item__text">
                <span class="cta-item__name">{{ c.customer_name }}</span>
                @if (c.email) {
                  <span class="cta-item__email">{{ c.email }}</span>
                } @else if (c.company_name) {
                  <span class="cta-item__email">{{ c.company_name }}</span>
                }
              </span>
            </li>
          }

          <!-- Empty state -->
          @if (!loading() && results().length === 0 && query().trim().length > 0) {
            <li class="cta-empty">
              <span class="cta-empty__msg">
                No customers found for <strong>"{{ query() }}"</strong>
              </span>
              <button type="button" class="cta-create-btn" (click)="onCreateNew()">
                <span class="material-symbols-outlined">person_add</span>
                Create "{{ query() }}" as new customer
              </button>
            </li>
          }

          <!-- Loading -->
          @if (loading()) {
            <li class="cta-loading">
              <span class="cta-spinner"></span>
              Searching…
            </li>
          }

          <!-- Idle (no query) -->
          @if (!loading() && results().length === 0 && query().trim().length === 0) {
            <li class="cta-hint">
              <span class="material-symbols-outlined">search</span>
              Start typing to search customers
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './customer-typeahead.css',
})
export class CustomerTypeaheadComponent implements OnDestroy {
  private readonly http = inject(HttpClient);

  // ── Inputs / Outputs ─────────────────────────────────────
  /** Pre-selected customer ID (for edit mode) */
  customerId = input<string>('');
  /** Pre-selected customer label (for edit mode display) */
  customerLabel = input<string>('');
  disabled = input(false);

  customerSelected = output<{ id: string; label: string }>();
  createNew = output<string>(); // emits the query string

  // ── State ─────────────────────────────────────────────────
  query = signal('');
  results = signal<CustomerOption[]>([]);
  loading = signal(false);
  open = signal(false);
  selectedId = signal('');
  selectedLabel = signal('');
  highlightIdx = signal(-1);

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  protected readonly String = String;

  constructor() {
    this.search$
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          if (!q.trim()) { this.results.set([]); this.loading.set(false); return of(null); }
          this.loading.set(true);
          return this.http.get<{ success: boolean; data: { customers?: CustomerOption[]; rows?: CustomerOption[] } }>(
            `${CUST_API}?page=1&limit=10&search=${encodeURIComponent(q)}`
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (!res) return;
          this.results.set(res.data.customers ?? res.data.rows ?? []);
          this.loading.set(false);
          this.highlightIdx.set(-1);
        },
        error: () => { this.loading.set(false); },
      });

    // Sync selectedId/label from inputs when they change (edit mode init)
    // We watch via effect-like pattern using ngOnChanges substitute:
    // resolved in ngOnInit by the parent calling selectById
  }

  ngOnChanges() {
    // When parent sets customerId + customerLabel (edit mode load)
    if (this.customerId() && this.customerId() !== this.selectedId()) {
      this.selectedId.set(this.customerId());
      this.selectedLabel.set(this.customerLabel());
      this.query.set(this.customerLabel()); // show name in input
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.query.set(val);
    this.open.set(true);
    if (!val.trim()) { this.clearSelection(); }
    this.search$.next(val);
  }

  onFocus() {
    this.open.set(true);
    if (this.query().trim()) this.search$.next(this.query());
  }

  onBlur() {
    // Small delay so click on a result fires first
    setTimeout(() => {
      this.open.set(false);
      // If nothing confirmed, revert display to last selected label
      if (this.selectedId()) {
        this.query.set(this.selectedLabel());
      } else {
        this.query.set('');
      }
    }, 180);
  }

  onKey(event: KeyboardEvent) {
    const len = this.results().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightIdx.update((i) => Math.min(i + 1, len - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightIdx.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlightIdx();
      if (idx >= 0 && idx < len) this.select(this.results()[idx]);
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  select(c: CustomerOption) {
    const label = c.customer_name;
    this.selectedId.set(String(c.customer_id));
    this.selectedLabel.set(label);
    this.query.set(label);
    this.open.set(false);
    this.customerSelected.emit({ id: String(c.customer_id), label });
  }

  clearSelection() {
    this.selectedId.set('');
    this.selectedLabel.set('');
    this.query.set('');
    this.results.set([]);
    this.customerSelected.emit({ id: '', label: '' });
  }

  onCreateNew() {
    this.open.set(false);
    this.createNew.emit(this.query());
  }
}
