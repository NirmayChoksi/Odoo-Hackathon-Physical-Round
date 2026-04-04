import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { authRepository } from './auth.repository';
import { sendMail } from '../../shared/mailer';
import { fail } from '../../utils/apiResponse';
import type { SignupBody, LoginBody, ResetPasswordBody, VerifyResetBody } from './auth.types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const authService = {
  async signup(data: SignupBody) {
    const { email, password, full_name, phone } = data;

    // Check if email already exists
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw fail('Email already exists.', 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password!, salt);

    // Default role_id = 3 (Portal User)
    const roleId = 3;

    await authRepository.createUser({
      full_name,
      email,
      password_hash: hashedPassword,
      role_id: roleId,
      phone
    });

    return { message: 'User registered successfully.' };
  },

  async login(data: LoginBody) {
    const { email, password } = data;

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw fail('Invalid credentials.', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password!, user.password_hash);
    if (!isMatch) {
      throw fail('Invalid credentials.', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw fail('Account is not active.', 403);
    }

    // Generate JWT
    const payload = {
      userId: user.user_id,
      roleId: user.role_id,
      email: user.email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return {
      message: 'Login successful.',
      token,
      user: {
        id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        status: user.status
      }
    };
  },

  async resetPassword(data: ResetPasswordBody) {
    const { email } = data;

    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Return success to prevent email enumeration
      return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash the token for database storage
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Expiry time (1 hour from now)
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to DB
    await authRepository.createPasswordReset({
      user_id: user.user_id!,
      reset_token: hashedToken,
      expiry_time: expiryTime
    });

    // Construct reset link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/reset-password?token=${token}&email=${email}`;

    const htmlMessage = `
      <p>Hello ${user.full_name},</p>
      <p>You requested to reset your password.</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link is valid for 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email
    await sendMail(email, 'Password Reset Request', htmlMessage);

    return { message: 'If that email address is in our database, we will send you an email to reset your password.' };
  },

  async verifyReset(data: VerifyResetBody) {
    const { email, token, newPassword } = data;

    const hashedTokenForm = crypto.createHash('sha256').update(token).digest('hex');

    // Find token in DB
    const resetRecord = await authRepository.findValidResetToken(hashedTokenForm, email);

    if (!resetRecord) {
      throw fail('Token is invalid or has expired.', 400);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword!, salt);

    // Update the password in db
    await authRepository.updateUserPassword(resetRecord.user_id, hashedPassword);

    // Mark the token as used
    await authRepository.markResetTokenAsUsed(resetRecord.reset_id);

    return { message: 'Password has been successfully updated.' };
  }
};

