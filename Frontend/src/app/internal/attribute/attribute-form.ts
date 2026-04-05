import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttributeApiService } from './attribute-api.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog';
import { firstValueFrom } from 'rxjs';
import {
  CONFIGURATION_DROPDOWN_ITEMS,
  SUBSCRIPTION_APP_PATHS,
  USERS_CONTACTS_DROPDOWN_ITEMS,
} from '../subscription-app.constants';
import { AttributeStore } from './attribute.store';

export interface AttributeValue {
  id?: number;
  value: string;
  extraPrice: string | number;
}

@Component({
  selector: 'app-attribute-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './attribute-form.html',
  styleUrl: './attribute-form.css'
})
export class AttributeFormComponent implements OnInit {
  private readonly store = inject(AttributeStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  attributeId = signal<number | null>(null);
  isLoading = this.store.isLoading;

  // Form State
  attributeName = signal<string>('');

  // Table Data
  attributeValues = signal<AttributeValue[]>([]);

  // Dialog State
  showDialog = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogVariant = signal<'danger' | 'warning' | 'primary'>('primary');
  dialogConfirmLabel = signal('OK');
  isBusy = signal(false);
  isDeleting = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.attributeId.set(Number(id));
      await this.loadAttribute(this.attributeId()!);
    } else {
      this.attributeValues.set([{ value: '', extraPrice: '' }]);
    }
  }

  async loadAttribute(id: number) {
    const res = await this.store.loadOne(id);
    if (res.success && res.data) {
      const a = res.data;
      this.attributeName.set(a.name || a.display_name);
      if (a.values && a.values.length > 0) {
        this.attributeValues.set(a.values.map((v: any) => ({
          id: v.value_id,
          value: v.value || v.value_name,
          extraPrice: v.extra_price || ''
        })));
      } else {
        this.attributeValues.set([{ value: '', extraPrice: '' }]);
      }
    }
  }

  onNew() {
    this.attributeId.set(null);
    this.attributeName.set('');
    this.attributeValues.set([{ value: '', extraPrice: '' }]);
  }

  async onDelete() {
    if (!this.attributeId()) return;
    this.showDialog.set(true);
    this.dialogTitle.set('Delete Attribute');
    this.dialogMessage.set('Are you sure you want to delete this attribute? This action cannot be undone.');
    this.dialogVariant.set('danger');
    this.dialogConfirmLabel.set('Delete');
  }

  async performDelete() {
    if (!this.attributeId()) return;
    this.isDeleting.set(true);

    const res = await this.store.remove(this.attributeId()!);
    this.isDeleting.set(false);

    if (res.success) {
      this.showDialog.set(true);
      this.dialogTitle.set('Success');
      this.dialogMessage.set('Attribute deleted successfully.');
      this.dialogVariant.set('primary');
      this.dialogConfirmLabel.set('OK');
    } else {
      this.showDialog.set(true);
      this.dialogTitle.set('Error');
      this.dialogMessage.set('Failed to delete attribute. Please try again.');
      this.dialogVariant.set('danger');
      this.dialogConfirmLabel.set('OK');
    }
  }

  onDialogConfirmed() {
    if (this.dialogTitle() === 'Attribute deleted successfully.' ||
      (this.dialogTitle() === 'Success' && this.dialogVariant() === 'primary')) {
      this.router.navigate([SUBSCRIPTION_APP_PATHS.attribute]);
    }
    this.showDialog.set(false);
  }

  async onSave() {
    this.isBusy.set(true);

    const valuesBody = this.attributeValues()
      .map(v => {
        const isEmpty = v.value.trim() === '';
        if (isEmpty && v.id) {
          return { value_id: v.id, delete: true, value: '' };
        } else if (!isEmpty) {
          return {
            value_id: v.id,
            value: v.value,
            extraPrice: Number(v.extraPrice) || 0
          };
        }
        return null;
      })
      .filter(v => v !== null);

    const body = {
      name: this.attributeName(),
      values: valuesBody
    };

    if (this.attributeId()) {
      const res = await this.store.update(this.attributeId()!, body);
      this.isBusy.set(false);

      if (res.success) {
        this.showDialog.set(true);
        this.dialogTitle.set('Success');
        this.dialogMessage.set('Attribute updated successfully!');
        this.dialogVariant.set('primary');
        this.dialogConfirmLabel.set('OK');
        await this.loadAttribute(this.attributeId()!);
      } else {
        this.showDialog.set(true);
        this.dialogTitle.set('Error');
        this.dialogMessage.set(res.error || 'Failed to update attribute. Please try again.');
        this.dialogVariant.set('danger');
        this.dialogConfirmLabel.set('OK');
      }
    } else {
      const res = await this.store.create(body);
      this.isBusy.set(false);

      if (res.success && res.data) {
        this.showDialog.set(true);
        this.dialogTitle.set('Success');
        this.dialogMessage.set('Attribute created successfully!');
        this.dialogVariant.set('primary');
        this.dialogConfirmLabel.set('OK');
        this.attributeId.set(res.data.attributeId);
        await this.loadAttribute(res.data.attributeId);
      } else {
        this.showDialog.set(true);
        this.dialogTitle.set('Error');
        this.dialogMessage.set(res.error || 'Failed to create attribute. Please try again.');
        this.dialogVariant.set('danger');
        this.dialogConfirmLabel.set('OK');
      }
    }
  }

  addValueRow() {
    this.attributeValues.set([...this.attributeValues(), { value: '', extraPrice: '' }]);
  }

  removeValueRow(index: number) {
    const newValues = [...this.attributeValues()];
    newValues.splice(index, 1);
    this.attributeValues.set(newValues);
  }
}
