import { Injectable, signal } from '@angular/core';

export type UserRole = 'Admin' | 'portal' | 'Internal';

export interface User {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersDB = signal<User[]>([
    { name: 'Admin', email: 'admin@system.local', password: 'AdminPassword123!', role: 'Admin' }
  ]);
  
  public currentUser = signal<User | null>(null);

  constructor() {}

  async checkEmailExists(email: string): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.usersDB().some(u => u.email === email));
      }, 400); // Simulate network delay
    });
  }

  async login(email: string, password: string):Promise<{success: boolean, error?: string}> {
    return new Promise(resolve => {
      setTimeout(() => {
        const user = this.usersDB().find(u => u.email === email);
        if (!user) {
          resolve({ success: false, error: 'Account not exist' });
          return;
        }
        if (user.password !== password) {
          resolve({ success: false, error: 'Invalid password' });
          return;
        }
        this.currentUser.set({ ...user, password: '' });
        resolve({ success: true });
      }, 500);
    });
  }

  async signup(name: string, email: string, password: string): Promise<{success: boolean, error?: string}> {
    return new Promise(async resolve => {
      const exists = await this.checkEmailExists(email);
      if (exists) {
        resolve({ success: false, error: 'Email Id duplicate in database' });
        return;
      }
      setTimeout(() => {
        const newUser: User = { name, email, password, role: 'portal' };
        this.usersDB.update(users => [...users, newUser]);
        resolve({ success: true });
      }, 500);
    });
  }

  async resetPassword(email: string): Promise<{success: boolean, error?: string}> {
    return new Promise(async resolve => {
      const exists = await this.checkEmailExists(email);
      if (!exists) {
         resolve({ success: false, error: 'Email does not exist to reset password' });
         return;
      }
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
  }
}
