export interface TaxRow {
  tax_id: number;
  tax_name: string;
  tax_type: 'PERCENTAGE' | 'FIXED';
  tax_percentage: number;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
}

export interface TaxListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreateTaxBody {
  taxName: string;
  taxType: 'PERCENTAGE' | 'FIXED';
  taxPercentage: number;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PatchTaxBody extends Partial<CreateTaxBody> {}
