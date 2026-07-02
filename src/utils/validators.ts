import { z } from 'zod';

export const personalAccessTokenSchema = z
  .string()
  .trim()
  .min(20, 'توکن نامعتبر است')
  .regex(/^sbp_[a-zA-Z0-9]+$/, 'فرمت Personal Access Token صحیح نیست (باید با sbp_ شروع شود)');

export const accountLabelSchema = z
  .string()
  .trim()
  .min(1, 'نام نمی‌تواند خالی باشد')
  .max(50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد');

export const projectNameSchema = z
  .string()
  .trim()
  .min(3, 'نام پروژه باید حداقل ۳ کاراکتر باشد')
  .max(63, 'نام پروژه خیلی طولانی است')
  .regex(/^[a-zA-Z0-9 _-]+$/, 'نام پروژه فقط می‌تواند شامل حروف، عدد، فاصله، - و _ باشد');

export const dbPasswordSchema = z
  .string()
  .min(8, 'رمز عبور دیتابیس باید حداقل ۸ کاراکتر باشد')
  .max(100);

export const sqlQuerySchema = z
  .string()
  .trim()
  .min(1, 'کوئری نمی‌تواند خالی باشد')
  .max(100000, 'کوئری بیش از حد طولانی است');

export function safeParseOrNull<T>(schema: z.ZodSchema<T>, value: unknown): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}
