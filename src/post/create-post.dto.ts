import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).describe('My First Post'),
  content: z.string().min(1).describe('This is the content of my first post.'),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
