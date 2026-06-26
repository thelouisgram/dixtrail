import { z } from "zod";
import { LocationStatus, Role, ContactMode } from "@prisma/client";

const requiredObjectId = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .regex(/^[a-f\d]{24}$/i, `Select a valid ${label.toLowerCase()}`);

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(Role),
});

export const createCountrySchema = z.object({
  name: z.string().trim().min(1, "Country name is required"),
});

export const createStateSchema = z.object({
  name: z.string().trim().min(1, "State name is required"),
  countryId: requiredObjectId("Country"),
});

/** Client-side location form — all fields registered with RHF */
export const locationFormSchema = z.object({
  eventName: z.string().trim().min(1, "Event name is required"),
  countryId: z.string().min(1, "Country is required"),
  stateId: z.string().min(1, "State is required"),
  address: z.string().optional(),
  assignedRepId: z.string().nullable().optional(),
  status: z.nativeEnum(LocationStatus),
  contactMode: z.nativeEnum(ContactMode).nullable().optional(),
  reachedOutDate: z.string().optional(),
  notes: z.string().optional(),
});

/** API: create location */
export const createLocationSchema = z.object({
  eventName: z.string().trim().min(1, "Event name is required"),
  countryId: requiredObjectId("Country"),
  stateId: requiredObjectId("State"),
  address: z.string().trim().optional(),
  assignedRepId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  contactMode: z.nativeEnum(ContactMode).nullable().optional(),
  reachedOutDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

/** API: update location */
export const updateLocationSchema = z.object({
  eventName: z.string().trim().min(1).optional(),
  countryId: requiredObjectId("Country").optional(),
  stateId: requiredObjectId("State").optional(),
  address: z.string().trim().nullable().optional(),
  assignedRepId: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .nullable()
    .optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  contactMode: z.nativeEnum(ContactMode).nullable().optional(),
  reachedOutDate: z.string().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
});

export const locationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  countryId: z.string().optional(),
  stateId: z.string().optional(),
  assignedRepId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type CreateStateInput = z.infer<typeof createStateSchema>;
export type LocationFormInput = z.infer<typeof locationFormSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQueryInput = z.infer<typeof locationQuerySchema>;

/** Normalize form values before API submission */
export function toCreateLocationPayload(data: LocationFormInput): CreateLocationInput {
  return createLocationSchema.parse({
    ...data,
    address: data.address?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    assignedRepId: data.assignedRepId || undefined,
    reachedOutDate: data.reachedOutDate || undefined,
  });
}

export function toUpdateLocationPayload(data: LocationFormInput): UpdateLocationInput {
  return updateLocationSchema.parse({
    ...data,
    address: data.address?.trim() || null,
    notes: data.notes?.trim() || null,
    assignedRepId: data.assignedRepId ?? null,
    reachedOutDate: data.reachedOutDate || null,
    contactMode: data.contactMode ?? null,
  });
}
