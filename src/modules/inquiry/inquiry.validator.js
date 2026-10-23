const { z } = require('zod');

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Enter a valid email').max(160),
  phone: z.string().trim().max(40).optional().default(''),
  tour: z.string().trim().max(160).optional().default(''),
  tier: z.enum(['luxury', 'midrange', 'budget', 'not-sure']).default('not-sure'),
  travelMonth: z.string().trim().max(40).optional().default(''),
  travellers: z.coerce.number().int().min(1).max(50).default(2),
  message: z.string().trim().max(3000).optional().default(''),
  website: z.string().max(0).optional().default(''), // honeypot: bots fill it
});

/** @returns {{data?: object, errors?: Record<string,string>}} */
exports.validateInquiry = (body) => {
  const parsed = schema.safeParse(body);
  if (parsed.success) return { data: parsed.data };
  const errors = {};
  parsed.error.issues.forEach((i) => { errors[i.path[0]] = i.message; });
  return { errors };
};
