export interface CreateUserBody {
  fullName: string;
  email: string;
  password?: string;
  roleId: number;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface PatchUserBody extends Partial<CreateUserBody> {}
