import { z } from "zod";

const TYPE_MAP: Record<string, () => z.ZodTypeAny> = {
  string: () => z.string(),
  number: () => z.number(),
  boolean: () => z.boolean(),
};

function fieldToZodType(field: unknown): z.ZodTypeAny {
  if (typeof field === "string") {
    return TYPE_MAP[field]?.() ?? z.string();
  }

  if (typeof field === "object" && field !== null && "type" in field) {
    const type = String((field as { type: string }).type);
    return TYPE_MAP[type]?.() ?? z.string();
  }

  return z.string();
}

export function parseExtractSchema(
  schemaJson: string,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const parsed = JSON.parse(schemaJson) as Record<string, unknown>;
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const [key, field] of Object.entries(parsed)) {
    shape[key] = fieldToZodType(field);
  }

  return z.object(shape);
}
