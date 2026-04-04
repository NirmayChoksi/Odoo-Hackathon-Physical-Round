export interface CreateContactBody {
  contactName: string;
  email?: string;
  phone?: string;
  designation?: string;
}

export interface PatchContactBody extends Partial<CreateContactBody> {}
