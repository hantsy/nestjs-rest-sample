import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(1).describe('john_doe'),
  email: z.string().email().describe('john@example.com'),
  password: z
    .string()
    .min(8, ' The min length of password is 8 ')
    .max(20, " The password can't accept more than 20 characters ")
    .describe('P@ssword123'),
  firstName: z.string().optional().describe('John'),
  lastName: z.string().optional().describe('Doe'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
