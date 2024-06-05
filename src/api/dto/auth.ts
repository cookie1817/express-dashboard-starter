import { z } from 'zod';

export const userSignUpDto = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    business_name: z.string(),
});

export const userSignInDto = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const forgetPasswordDto = z.object({
    email: z.string().email()
});