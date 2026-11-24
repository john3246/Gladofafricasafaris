const { z } = require('zod');

const day = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker').refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'That is not a real date');
const optionalDay = z.union([day, z.literal('')]).optional().default('');
const checked = z.preprocess((v) => ['1', 'on', 'true'].includes(String(Array.isArray(v) ? v[v.length - 1] : v)), z.boolean());
// A form field ticked several times arrives as an array, ticked once as a string, never as nothing.
const textList = z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.string().trim().min(1).max(60)).max(30));

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Enter a valid email').max(160),
  phone: z.string().trim().max(40).optional().default(''),
  tourSlug: z.string().trim().max(120).optional().default(''),
  tour: z.string().trim().max(160).optional().default(''),
  startDate: optionalDay,
  endDate: optionalDay,
  flexible: checked.optional().default(false),
  travelMonth: z.string().trim().max(40).optional().default(''),
  adults: z.coerce.number().int().min(1, 'At least 1 adult').max(50).default(2),
  children: z.coerce.number().int().min(0).max(30).default(0),
  styles: textList.optional().default([]),
  tier: z.string().trim().max(40).optional().default('not-sure'),
  message: z.string().trim().max(3000).optional().default(''),
  website: z.string().max(0).optional().default(''), // honeypot: bots fill it
}).superRefine((d, ctx) => {
  const today = new Date().toISOString().slice(0, 10);
  if (!d.startDate && !d.travelMonth) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Choose your travel dates, or a month if you do not have dates yet' });
  if (d.startDate && d.startDate < today) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'The start date is in the past' });
  if (d.endDate && !d.startDate) ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Add the start date too' });
  if (d.endDate && d.startDate && d.endDate < d.startDate) ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'The end date is before the start date' });
});

/** @returns {{data?: object, errors?: Record<string,string>}} */
exports.validateInquiry = (body) => {
  const parsed = schema.safeParse(body);
  if (parsed.success) return { data: { ...parsed.data, travellers: parsed.data.adults + parsed.data.children } };
  const errors = {};
  parsed.error.issues.forEach((i) => { if (!errors[i.path[0]]) errors[i.path[0]] = i.message; });
  return { errors };
};
