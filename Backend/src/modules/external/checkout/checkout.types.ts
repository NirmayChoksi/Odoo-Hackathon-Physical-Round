export interface SavePaymentBody {
  paymentMethod: string;
}

export interface PlaceOrderBody {
  /** Optional if checkout `select-address` was used (stored on cart). */
  addressId?: number;
  paymentMethod?: string;
}

export interface SelectAddressBody {
  addressId: number;
}
