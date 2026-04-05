import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SUBSCRIPTION_APP_PATHS, subscriptionAttributeDetailPath } from '../subscription-app.constants';
import { AttributeApiService } from './attribute-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-attribute-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './attribute-list.html',
  styleUrl: './attribute-list.css'
})
export class AttributeListComponent implements OnInit {
  private readonly api = inject(AttributeApiService);

  readonly paths = SUBSCRIPTION_APP_PATHS;
  readonly attributeDetailPath = subscriptionAttributeDetailPath;

  // Table Data
  attributes = signal<any[]>([]);
  isLoading = signal(false);
  searchQuery = signal('');

  async ngOnInit() {
    await this.loadAttributes();
  }

  async loadAttributes() {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.list());
      if (res.success) {
        this.attributes.set(res.data.map((a: any) => ({
          id: a.attribute_id,
          name: a.display_name,
          values: a.values?.map((v: any) => v.value_name).join(', ') || ''
        })));
      }
    } catch (err) {
      console.error('Failed to load attributes', err);
    } finally {
      this.isLoading.set(false);
    }
  }

}
