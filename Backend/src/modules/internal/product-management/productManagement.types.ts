export interface ProductListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreateProductBody {
  productName: string;
  productType: string;
  salesPrice: number;
  costPrice?: number;
  description?: string;
  imageUrl?: string;
  shortDescription?: string;
  termsAndConditions?: string;
  isRecurring?: boolean;
  status?: string;
}

export interface PatchProductBody extends Partial<CreateProductBody> {}

export interface CreateVariantBody {
  attributeName: string;
  attributeValue: string;
  extraPrice?: number;
  status?: string;
}

export interface PatchVariantBody extends Partial<CreateVariantBody> {}

export interface AttachPlanBody {
  planId: number;
  isDefault?: boolean;
  status?: string;
}
