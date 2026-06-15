import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

export const oauthLoginSchema = Joi.object({
  provider: Joi.string().valid("google", "linkedin").required(),
  providerId: Joi.string().required(),
  email: Joi.string().email().lowercase().trim().required(),
  name: Joi.string().trim().min(2).max(100).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().trim(),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  q: Joi.string().trim().allow(""),
  status: Joi.string().trim(),
  platform: Joi.string().trim(),
  type: Joi.string().trim(),
  range: Joi.string().valid("7d", "14d", "30d", "90d"),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
});

export const businessInputSchema = Joi.object({
  businessName: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  audience: Joi.string().trim().max(1000).required(),
  tone: Joi.string().trim().max(200).required(),
});

export const analysisRequestSchema = Joi.object({
  businessId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

export const strategyRequestSchema = Joi.object({
  businessId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

export const contentRequestSchema = Joi.object({
  strategyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
  platform: Joi.string().valid("linkedin", "instagram", "facebook").required(),
});

export const weeklyContentRequestSchema = Joi.object({
  strategyId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),
});

export function validateAIResponse<T>(
  data: unknown,
  requiredFields: string[],
): T {
  if (!data || typeof data !== "object") {
    throw new Error("AI returned invalid response: not an object");
  }

  const obj = data as Record<string, unknown>;
  const missingFields = requiredFields.filter(
    (field) =>
      !(field in obj) || obj[field] === undefined || obj[field] === null,
  );

  if (missingFields.length > 0) {
    throw new Error(
      `AI response missing required fields: ${missingFields.join(", ")}`,
    );
  }

  return data as T;
}
