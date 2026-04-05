export type DueType = "IMMEDIATE" | "FIXED_DAYS" | "END_OF_MONTH" | "SPLIT_PAYMENT";
export type StartFrom = "INVOICE_DATE" | "SUBSCRIPTION_START_DATE";
export type FeeDiscountType = "FIXED" | "PERCENTAGE";
export type PaymentMethodCode = "CARD" | "BANK_TRANSFER" | "UPI" | "CASH";
export type TermStatus = "ACTIVE" | "INACTIVE";

export interface PaymentTermListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: TermStatus;
}

export interface PaymentTermInstallmentInput {
  installmentNumber: number;
  percentage: number;
  dueAfterDays: number;
  description?: string | null;
}

export interface PaymentTermMethodInput {
  paymentMethod: PaymentMethodCode;
  isDefault?: boolean;
}

export interface CreatePaymentTermBody {
  termName: string;
  description?: string | null;
  dueType: DueType;
  days?: number | null;
  graceDays?: number;
  startFrom?: StartFrom;
  isDefault?: boolean;
  status?: TermStatus;
  enableLateFee?: boolean;
  lateFeeType?: FeeDiscountType | null;
  lateFeeValue?: number | null;
  lateFeeAfterDays?: number | null;
  enableEarlyDiscount?: boolean;
  earlyDiscountType?: FeeDiscountType | null;
  earlyDiscountValue?: number | null;
  earlyDiscountWithinDays?: number | null;
  notes?: string | null;
  internalRemarks?: string | null;
  installments?: PaymentTermInstallmentInput[];
  methods?: PaymentTermMethodInput[];
}

export type PatchPaymentTermBody = Partial<CreatePaymentTermBody> & {
  /** When true with installments array, replaces all installments */
  replaceInstallments?: boolean;
  /** When true with methods array, replaces all allowed methods */
  replaceMethods?: boolean;
};

export interface PaymentTermDto {
  paymentTermId: number;
  termName: string;
  description: string | null;
  dueType: DueType;
  days: number | null;
  graceDays: number;
  startFrom: StartFrom;
  isDefault: boolean;
  status: TermStatus;
  enableLateFee: boolean;
  lateFeeType: FeeDiscountType | null;
  lateFeeValue: number | null;
  lateFeeAfterDays: number | null;
  enableEarlyDiscount: boolean;
  earlyDiscountType: FeeDiscountType | null;
  earlyDiscountValue: number | null;
  earlyDiscountWithinDays: number | null;
  notes: string | null;
  internalRemarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTermInstallmentDto {
  installmentId: number;
  paymentTermId: number;
  installmentNumber: number;
  percentage: number;
  dueAfterDays: number;
  description: string | null;
}

export interface PaymentTermMethodDto {
  paymentTermMethodId: number;
  paymentTermId: number;
  paymentMethod: PaymentMethodCode;
  isDefault: boolean;
}

export interface PaymentTermPageData {
  paymentTerm: PaymentTermDto;
  installments: PaymentTermInstallmentDto[];
  methods: PaymentTermMethodDto[];
}
