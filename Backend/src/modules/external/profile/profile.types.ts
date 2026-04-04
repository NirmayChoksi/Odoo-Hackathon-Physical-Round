export interface UpdateProfileBody {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface SaveAddressBody {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}
