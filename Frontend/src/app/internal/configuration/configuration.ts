import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CONFIGURATION_HUB_MODULES, SUBSCRIPTION_APP_PATHS } from '../subscription-app.constants';
import { AttributeApiService } from '../attribute/attribute-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './configuration.html',
  styleUrl: './configuration.css'
})
export class ConfigurationComponent implements OnInit {
  private readonly attributeApi = inject(AttributeApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly hubModules = CONFIGURATION_HUB_MODULES;

  searchQuery = signal('');
  isLoading = signal(false);

  /** Rows fetched from Attribute API */
  rows = signal<any[]>([]);

  async ngOnInit() {
    await this.loadAttributes();
  }

  async loadAttributes() {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.attributeApi.list());
      if (res.success) {
        // Flatten attributes into value rows for the simplified hub view
        const flatRows: any[] = [];
        res.data.forEach((attr: any) => {
          if (attr.values && attr.values.length > 0) {
            attr.values.forEach((val: any) => {
              flatRows.push({
                id: `${attr.attribute_id}-${val.value_id}`,
                attributeName: attr.display_name,
                value: val.value_name,
                extraPrice: val.extra_price ? `${val.extra_price} R.s` : '0 R.s'
              });
            });
          } else {
            flatRows.push({
              id: `attr-${attr.attribute_id}`,
              attributeName: attr.display_name,
              value: '-',
              extraPrice: '-'
            });
          }
        });
        this.rows.set(flatRows);
      }
    } catch (err) {
      console.error('Hub failed to load attributes', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
      r =>
        r.attributeName.toLowerCase().includes(q) ||
        r.value.toLowerCase().includes(q) ||
        r.extraPrice.toLowerCase().includes(q)
    );
  });

  onDelete() {
    /* placeholder */
  }

  onGridAction() {
    /* placeholder — mockup secondary toolbar icon */
  }
}
