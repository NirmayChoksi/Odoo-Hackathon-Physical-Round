export interface SignupBody {
  full_name: string;
  email: string;
  password?: string;
  phone?: string | null;
}

export interface LoginBody {
  email: string;
  password?: string;
}

export interface ResetPasswordBody {
  email: string;
}

export interface VerifyResetBody {
  email: string;
  token: string;
  newPassword?: string;
}

export interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: number;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface PasswordResetRow {
  reset_id: number;
  user_id: number;
  reset_token: string;
  expiry_time: Date;
  used_flag: boolean;
  created_at?: Date;
}
