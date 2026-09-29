import { z } from 'zod';

export const updatePostSchema = z.object({
  title: z.string().min(1).describe('Updated Post Title'),
  content: z.string().min(1).describe('Updated content.'),
});

export type UpdatePostDto = z.infer<typeof updatePostSchema>;
