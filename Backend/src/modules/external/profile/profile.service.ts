import { fail } from "../../../utils/apiResponse";
import { profileRepository } from "./profile.repository";
import type { SaveAddressBody, UpdateProfileBody } from "./profile.types";

export const profileService = {
  async getProfile(userId: number) {
    const row = await profileRepository.getProfile(userId);
    if (!row) throw fail("User not found", 404);
    return {
      user_id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      role_id: row.role_id,
      status: row.status,
      created_at: row.created_at
    };
  },

  async updateProfile(userId: number, body: UpdateProfileBody) {
    if (body.email !== undefined) {
      const taken = await profileRepository.emailTakenByOther(body.email, userId);
      if (taken) throw fail("Email is already in use", 400);
    }
    await profileRepository.updateProfile(userId, {
      ...(body.fullName !== undefined && { full_name: body.fullName }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone === "" ? null : body.phone })
    });
    return this.getProfile(userId);
  },

  async listAddresses(userId: number) {
    const rows = await profileRepository.listAddresses(userId);
    return { addresses: rows };
  },

  async addAddress(userId: number, body: SaveAddressBody) {
    const id = await profileRepository.insertAddress(userId, body);
    return { address_id: id };
  },

  async updateAddress(userId: number, addressId: number, body: Partial<SaveAddressBody> & { isDefault?: boolean }) {
    const ok = await profileRepository.updateAddress(userId, addressId, body);
    if (!ok) throw fail("Address not found", 404);
    return { address_id: addressId, updated: true };
  },

  async deleteAddress(userId: number, addressId: number) {
    const ok = await profileRepository.deleteAddress(userId, addressId);
    if (!ok) throw fail("Address not found", 404);
    return { removed: true, address_id: addressId };
  },

  async setDefaultAddress(userId: number, addressId: number) {
    const ok = await profileRepository.setDefaultAddress(userId, addressId);
    if (!ok) throw fail("Address not found", 404);
    return { address_id: addressId, is_default: true };
  }
};
