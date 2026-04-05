export interface AttributeRow {
  attribute_id: number;
  name: string;
  created_at: Date;
}

export interface AttributeValueRow {
  value_id: number;
  attribute_id: number;
  value: string;
  extra_price: number;
  created_at: Date;
}

export interface AttributeWithValues extends AttributeRow {
  values: AttributeValueRow[];
}

export interface CreateAttributeBody {
  name: string;
  values?: Array<{ value: string; extraPrice?: number }>;
}

export interface PatchAttributeBody {
  name?: string;
  values?: Array<{ value_id?: number; value: string; extraPrice?: number; delete?: boolean }>;
}
