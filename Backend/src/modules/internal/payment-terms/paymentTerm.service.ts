import { fail } from "../../../utils/apiResponse";
import { paymentTermRepository } from "./paymentTerm.repository";
import type {
  CreatePaymentTermBody,
  PatchPaymentTermBody,
  PaymentTermInstallmentInput,
  PaymentTermListQuery,
  PaymentTermMethodInput,
} from "./paymentTerm.types";

function validateDueAndInstallments(body: {
  dueType: string;
  days?: number | null;
  installments?: PaymentTermInstallmentInput[];
}): void {
  if (body.dueType === "FIXED_DAYS") {
    const d = body.days;
    if (d == null || !Number.isFinite(Number(d)) || Number(d) < 0) {
      throw fail("days is required for FIXED_DAYS due type", 400);
    }
  }
  if (body.dueType === "IMMEDIATE" || body.dueType === "END_OF_MONTH") {
    /* days optional */
  }
  if (body.dueType === "SPLIT_PAYMENT") {
    const inst = body.installments ?? [];
    if (inst.length < 2) {
      throw fail("SPLIT_PAYMENT requires at least two installments", 400);
    }
    const sum = inst.reduce((s, r) => s + r.percentage, 0);
    if (Math.abs(sum - 100) > 0.02) {
      throw fail("Installment percentages must sum to 100", 400);
    }
  }
}

function validateMethodDefaults(methods: { isDefault?: boolean }[] | undefined): void {
  if (!methods?.length) return;
  const defs = methods.filter((m) => m.isDefault);
  if (defs.length > 1) {
    throw fail("At most one allowed method may be default", 400);
  }
}

export const paymentTermService = {
  async list(q: PaymentTermListQuery) {
    const { rows, total } = await paymentTermRepository.list(q);
    return {
      terms: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0,
      },
    };
  },

  async getPage(paymentTermId: number) {
    const data = await paymentTermRepository.getPageData(paymentTermId);
    if (!data) throw fail("Payment term not found", 404);
    return data;
  },

  async create(body: CreatePaymentTermBody) {
    validateDueAndInstallments(body);
    validateMethodDefaults(body.methods);
    if (body.enableLateFee && !body.lateFeeType) {
      throw fail("lateFeeType is required when enableLateFee is true", 400);
    }
    if (body.enableEarlyDiscount && !body.earlyDiscountType) {
      throw fail("earlyDiscountType is required when enableEarlyDiscount is true", 400);
    }
    const id = await paymentTermRepository.create(body);
    const page = await paymentTermRepository.getPageData(id);
    if (!page) throw fail("Failed to load created payment term", 500);
    return page;
  },

  async update(paymentTermId: number, body: PatchPaymentTermBody) {
    const existing = await paymentTermRepository.getById(paymentTermId);
    if (!existing) throw fail("Payment term not found", 404);

    const mergedDueType = body.dueType ?? existing.dueType;
    const mergedDays = body.days !== undefined ? body.days : existing.days;
    let mergedInstallments = body.installments;
    if (mergedInstallments === undefined && mergedDueType === "SPLIT_PAYMENT") {
      const page = await paymentTermRepository.getPageData(paymentTermId);
      mergedInstallments =
        page?.installments.map((i) => ({
          installmentNumber: i.installmentNumber,
          percentage: i.percentage,
          dueAfterDays: i.dueAfterDays,
          description: i.description,
        })) ?? [];
    }
    validateDueAndInstallments({
      dueType: mergedDueType,
      days: mergedDays,
      installments: mergedInstallments,
    });
    validateMethodDefaults(body.methods);

    if (body.enableLateFee === true && body.lateFeeType === undefined && !existing.lateFeeType) {
      throw fail("lateFeeType is required when enableLateFee is true", 400);
    }
    if (body.enableEarlyDiscount === true && body.earlyDiscountType === undefined && !existing.earlyDiscountType) {
      throw fail("earlyDiscountType is required when enableEarlyDiscount is true", 400);
    }

    const ok = await paymentTermRepository.update(paymentTermId, body);
    if (!ok) throw fail("Payment term not found", 404);
    return paymentTermRepository.getPageData(paymentTermId);
  },

  async remove(paymentTermId: number) {
    const ok = await paymentTermRepository.remove(paymentTermId);
    if (!ok) throw fail("Payment term not found", 404);
    return { paymentTermId, deleted: true };
  },

  async addInstallment(paymentTermId: number, row: PaymentTermInstallmentInput) {
    const term = await paymentTermRepository.getById(paymentTermId);
    if (!term) throw fail("Payment term not found", 404);
    if (term.dueType !== "SPLIT_PAYMENT") {
      throw fail("Installments are only allowed for SPLIT_PAYMENT terms", 400);
    }
    const id = await paymentTermRepository.addInstallment(paymentTermId, row);
    const inst = await paymentTermRepository.getInstallmentById(id);
    if (!inst) throw fail("Failed to load installment", 500);
    return inst;
  },

  async patchInstallment(installmentId: number, patch: Partial<PaymentTermInstallmentInput>) {
    const cur = await paymentTermRepository.getInstallmentById(installmentId);
    if (!cur) throw fail("Installment not found", 404);
    const ok = await paymentTermRepository.patchInstallment(installmentId, patch);
    if (!ok) throw fail("Installment not found", 404);
    return paymentTermRepository.getInstallmentById(installmentId);
  },

  async deleteInstallment(installmentId: number) {
    const cur = await paymentTermRepository.getInstallmentById(installmentId);
    if (!cur) throw fail("Installment not found", 404);
    const term = await paymentTermRepository.getById(cur.paymentTermId);
    if (term?.dueType === "SPLIT_PAYMENT") {
      const page = await paymentTermRepository.getPageData(cur.paymentTermId);
      const remaining = (page?.installments.length ?? 0) - 1;
      if (remaining < 2) {
        throw fail("SPLIT_PAYMENT terms must keep at least two installments", 400);
      }
    }
    const ok = await paymentTermRepository.deleteInstallment(installmentId);
    if (!ok) throw fail("Installment not found", 404);
    return { installmentId, deleted: true };
  },

  async addMethod(paymentTermId: number, row: PaymentTermMethodInput) {
    const term = await paymentTermRepository.getById(paymentTermId);
    if (!term) throw fail("Payment term not found", 404);
    if (row.isDefault) {
      await paymentTermRepository.clearMethodDefaultsForTerm(paymentTermId);
    }
    const id = await paymentTermRepository.addMethod(paymentTermId, row);
    const created = await paymentTermRepository.getMethodById(id);
    if (!created) throw fail("Failed to load method", 500);
    return created;
  },

  async deleteMethod(paymentTermMethodId: number) {
    const ok = await paymentTermRepository.deleteMethod(paymentTermMethodId);
    if (!ok) throw fail("Payment method row not found", 404);
    return { paymentTermMethodId, deleted: true };
  },
};
