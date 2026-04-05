import { fail } from "../../../utils/apiResponse";
import { userRepository } from "./user.repository";
import type { CreateUserBody, PatchUserBody } from "./user.types";

export const userService = {
  async list() {
    return userRepository.listAll();
  },

  async get(id: number) {
    const u = await userRepository.getById(id);
    if (!u) throw fail("User not found", 404);
    return u;
  },

  async create(body: CreateUserBody) {
    const id = await userRepository.insert(body);
    return userRepository.getById(id);
  },

  async update(userId: number, body: PatchUserBody) {
    const ok = await userRepository.update(userId, body);
    if (!ok) throw fail("User not found", 404);
    return userRepository.getById(userId);
  },

  async remove(userId: number) {
    if (userId === 1 || userId === 2 || userId === 3) throw fail("Cannot delete pre-configured system users", 403);
    const ok = await userRepository.delete(userId);
    if (!ok) throw fail("User not found", 404);
    return { user_id: userId, removed: true };
  }
};
