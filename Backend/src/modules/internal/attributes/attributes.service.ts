import { fail } from "../../../utils/apiResponse";
import { attributesRepository } from "./attributes.repository";
import type { CreateAttributeBody, PatchAttributeBody } from "./attributes.types";

export const attributesService = {
  async list() {
    const attrs = await attributesRepository.list();
    const result = [];
    for (const a of attrs) {
      const rows = await attributesRepository.getWithValues(a.attribute_id);
      const values = rows.filter(r => r.value_id).map(r => ({
        value_id: r.value_id,
        value: r.value,
        extra_price: r.extra_price
      }));
      result.push({ ...a, values });
    }
    return result;
  },

  async get(attributeId: number) {
    const rows = await attributesRepository.getWithValues(attributeId);
    if (!rows.length) throw fail("Attribute not found", 404);
    const a = rows[0];
    const values = rows.filter(r => r.value_id).map(r => ({
      value_id: r.value_id,
      value: r.value,
      extra_price: r.extra_price
    }));
    return {
      attribute_id: a.attribute_id,
      name: a.name,
      created_at: a.created_at,
      values
    };
  },

  async create(body: CreateAttributeBody) {
    console.log("CREATING ATTRIBUTE", JSON.stringify(body));
    const attributeId = await attributesRepository.insert(body.name);
    if (body.values?.length) {
      console.log("INSERTING VALUES", body.values.length);
      for (const v of body.values) {
        await attributesRepository.insertValue(attributeId, v.value, v.extraPrice || 0);
      }
    }
    return { attributeId };
  },

  async update(attributeId: number, body: PatchAttributeBody) {
    if (body.name) await attributesRepository.update(attributeId, body.name);
    if (body.values?.length) {
      for (const v of body.values) {
        if (v.delete && v.value_id) {
          await attributesRepository.deleteValue(v.value_id);
        } else if (v.value_id) {
          await attributesRepository.updateValue(v.value_id, v.value, v.extraPrice || 0);
        } else {
          await attributesRepository.insertValue(attributeId, v.value, v.extraPrice || 0);
        }
      }
    }
    return { success: true };
  },

  async remove(attributeId: number) {
    const deleted = await attributesRepository.delete(attributeId);
    if (!deleted) throw fail("Attribute not found", 404);
    return { success: true };
  }
};
