import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z
  .object({
    email: z.string().min(1, 'Email requis').email('Email invalide'),
    password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .regex(/[A-Z]/, 'Au moins une majuscule')
      .regex(/[0-9]/, 'Au moins un chiffre')
      .regex(/[^A-Za-z0-9]/, 'Au moins un caractère spécial'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
    name: z.string().min(2, 'Nom requis (min 2 caractères)'),
    rpps: z
      .string()
      .regex(/^\d{11}$/, 'RPPS doit contenir 11 chiffres')
      .optional()
      .or(z.literal('')),
    specialty: z.string().default('ORL'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
