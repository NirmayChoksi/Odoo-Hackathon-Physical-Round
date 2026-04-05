export interface PlanListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface CreatePlanBody {
  planName: string;
  price: number;
  billingPeriod: string;
  minimumQuantity?: number;
  startDate?: string;
  endDate?: string;
  autoClose?: boolean;
  closable?: boolean;
  pausable?: boolean;
  renewable?: boolean;
  status?: string;
}

export interface PatchPlanBody extends Partial<CreatePlanBody> {}
