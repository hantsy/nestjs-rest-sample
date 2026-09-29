import { z } from 'zod';

export const loginResponseSchema = z.object({
  access_token: z.string().describe('eyJhbGciOiJIUzI1NiIs...'),
  refresh_token: z.string().describe('eyJhbGciOiJIUzI1NiIs...'),
});

export type LoginResponseDto = z.infer<typeof loginResponseSchema>;
