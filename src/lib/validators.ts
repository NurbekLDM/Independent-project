import { z } from "zod";

export const authSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email().max(120),
  password: z.string().min(8).max(100),
});

export const loginSchema = authSchema.pick({ email: true, password: true });

export const normalizeSchema = z.object({
  text: z.string().min(5, "Matn juda qisqa").max(5000, "Matn juda uzun"),
  preset: z.enum(["social", "formal", "search"]),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});
