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
  cityIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
});

export const createCountrySchema = z.object({
  name: z.string().trim().min(1, "Country name is required"),
});

export const createStateSchema = z.object({
  name: z.string().trim().min(1, "Province/State name is required"),
  countryId: requiredObjectId("Country"),
});

export const createCitySchema = z.object({
  name: z.string().trim().min(1, "City name is required"),
  stateId: requiredObjectId("Province/State"),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.nativeEnum(Role).optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  cityIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).optional(),
});

const contactModesField = z.array(z.nativeEnum(ContactMode));

const contactFieldsRefinement = (
  data: {
    contactModes: ContactMode[];
    contactEmail?: string;
    contactPhone?: string;
  },
  ctx: z.RefinementCtx
) => {
  if (data.contactModes.includes(ContactMode.EMAIL) && !data.contactEmail?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["contactEmail"],
      message: "Email is required when Email outreach is selected",
    });
  }
  if (data.contactModes.includes(ContactMode.PHONE) && !data.contactPhone?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["contactPhone"],
      message: "Phone number is required when Phone outreach is selected",
    });
  }
};

const followUpDateRefinement = (
  data: { status?: LocationStatus; followUpDate?: string | null },
  ctx: z.RefinementCtx
) => {
  if (data.status === LocationStatus.FOLLOW_UP && !data.followUpDate?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["followUpDate"],
      message: "Follow-up date is required when status is Follow-up",
    });
  }
};

/** Client-side location form — all fields registered with RHF */
export const locationFormSchema = z
  .object({
    eventName: z.string().trim().min(1, "Event name is required"),
    countryId: z.string().min(1, "Country is required"),
    stateId: z.string().min(1, "Province/State is required"),
    cityId: requiredObjectId("City"),
    address: z.string().optional(),
    assignedRepId: z.string().nullable().optional(),
    status: z.nativeEnum(LocationStatus),
    contactModes: contactModesField,
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().optional(),
    reachedOutDate: z.string().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    contactFieldsRefinement(data, ctx);
    followUpDateRefinement(data, ctx);
  });

/** API: create location */
export const createLocationSchema = z
  .object({
    eventName: z.string().trim().min(1, "Event name is required"),
    countryId: requiredObjectId("Country"),
    stateId: requiredObjectId("Province/State"),
    cityId: requiredObjectId("City"),
    address: z.string().trim().optional(),
    assignedRepId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .optional(),
    status: z.nativeEnum(LocationStatus).optional(),
    contactModes: contactModesField,
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
    contactPhone: z.string().trim().optional(),
    reachedOutDate: z.string().optional(),
    followUpDate: z.string().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    contactFieldsRefinement(data, ctx);
    followUpDateRefinement(data, ctx);
  });

/** API: update location */
export const updateLocationSchema = z
  .object({
    eventName: z.string().trim().min(1).optional(),
    countryId: requiredObjectId("Country").optional(),
    stateId: requiredObjectId("Province/State").optional(),
    cityId: z
      .string()
      .regex(/^[a-f\d]{24}$/i, "Select a valid city")
      .nullable()
      .optional(),
    address: z.string().trim().nullable().optional(),
    assignedRepId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable()
      .optional(),
    status: z.nativeEnum(LocationStatus).optional(),
    contactModes: contactModesField.optional(),
    contactEmail: z.string().email("Invalid email address").nullable().optional().or(z.literal("")),
    contactPhone: z.string().trim().nullable().optional(),
    reachedOutDate: z.string().nullable().optional(),
    followUpDate: z.string().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contactModes === undefined) return;
    contactFieldsRefinement(
      {
        contactModes: data.contactModes,
        contactEmail: data.contactEmail ?? undefined,
        contactPhone: data.contactPhone ?? undefined,
      },
      ctx
    );
    followUpDateRefinement(
      {
        status: data.status,
        followUpDate: data.followUpDate,
      },
      ctx
    );
  });

export const locationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.nativeEnum(LocationStatus).optional(),
  countryId: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  assignedRepId: z.string().optional(),
  mineOnly: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
export type CreateStateInput = z.infer<typeof createStateSchema>;
export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LocationFormInput = z.infer<typeof locationFormSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type LocationQueryInput = z.infer<typeof locationQuerySchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

/** Normalize form values before API submission */
export function toCreateLocationPayload(data: LocationFormInput): CreateLocationInput {
  return createLocationSchema.parse({
    ...data,
    address: data.address?.trim() || undefined,
    notes: data.notes?.trim() || undefined,
    assignedRepId: data.assignedRepId || undefined,
    cityId: data.cityId,
    contactEmail: data.contactEmail?.trim() || undefined,
    contactPhone: data.contactPhone?.trim() || undefined,
    reachedOutDate: data.reachedOutDate || undefined,
    followUpDate: data.followUpDate || undefined,
  });
}

export function toUpdateLocationPayload(data: LocationFormInput): UpdateLocationInput {
  return updateLocationSchema.parse({
    ...data,
    address: data.address?.trim() || null,
    notes: data.notes?.trim() || null,
    assignedRepId: data.assignedRepId ?? null,
    cityId: data.cityId,
    contactEmail: data.contactEmail?.trim() || null,
    contactPhone: data.contactPhone?.trim() || null,
    reachedOutDate: data.reachedOutDate || null,
    followUpDate: data.followUpDate || null,
  });
}
