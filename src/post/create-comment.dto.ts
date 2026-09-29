import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1).describe('Great post!'),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
