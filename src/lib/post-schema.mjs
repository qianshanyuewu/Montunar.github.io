import { z } from 'astro/zod';

// Shared by Astro's collection and the standalone content validator.
export const postSchema = z.object({
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(['thinking', 'technology', 'art', 'updates', 'exam']),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  pinned: z.boolean().default(false),
  description: z.string(),
  source: z.string().optional(),
  legacyDate: z.string().optional(),
});
