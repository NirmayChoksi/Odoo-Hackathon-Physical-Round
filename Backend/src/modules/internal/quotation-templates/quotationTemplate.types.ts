export interface TemplateListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreateTemplateBody {
  templateName: string;
  validityDays?: number;
  planId?: number | null;
  description?: string;
  status?: string;
}

export interface PatchTemplateBody extends Partial<CreateTemplateBody> {}

export interface CreateTemplateItemBody {
  productId: number;
  variantId?: number | null;
  quantity?: number;
  unitPrice: number;
  taxId?: number | null;
}

export interface PatchTemplateItemBody extends Partial<CreateTemplateItemBody> {}
