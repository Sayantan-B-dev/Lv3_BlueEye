import { z } from "zod";

export const artistSchemaValidation = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  slug: z.string().optional(),
  source: z.object({
    url: z.string().url("Must be a valid URL"),
    input_category: z.string().nullable().optional(),
    input_page: z.number().nullable().optional()
  }),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("India").optional()
  }).optional(),
  performance: z.object({
    duration_minutes: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    team_members: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    genres: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional()
  }).optional(),
  booking: z.object({ url: z.string().optional() }).optional(),
  about: z.string().optional(),
  faq: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required")
  })).optional(),
  media: z.object({
    videos: z.array(z.string()).optional(),
    images: z.array(z.string()).optional()
  }).optional(),
  featured: z.boolean().optional()
});

export const artistApplicantSchemaValidation = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  category_tag: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default("India").optional()
  }).optional(),
  performance: z.object({
    duration_minutes: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    team_members: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
    genres: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional()
  }).optional(),
  booking_link: z.string().optional(),
  about: z.string().optional(),
  faq: z.array(z.object({
    question: z.string().min(1, "Question is required"),
    answer: z.string().min(1, "Answer is required")
  })).optional(),
  media: z.object({
    videos: z.array(z.string()).min(1, "At least one YouTube video URL is required"),
    images: z.array(z.string()).min(1, "At least one image is required"),
  }),
  applicantEmail: z.string().email("Valid email is required"),
  applicantPhone: z.string().min(10, "Valid phone number is required"),
});

export const inquirySchemaValidation = z.object({
  artistId: z.string().min(1, "Artist ID is required"),
  artistName: z.string().min(1, "Artist name is required"),
  clientName: z.string().min(1, "Your name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientPhone: z.string().min(10, "Valid phone number is required"),
  clientAddress: z.string().max(300, "Address must be under 300 characters").optional(),
  eventDate: z.string().optional(),
  eventType: z.enum(["Wedding", "Corporate", "Private Party", "College", "Other"]),
  message: z.string().optional()
});

// ---- Event ticketing ----

export const ticketBuyerValidation = z.object({
  name: z.string().min(1, "Full name is required").max(120),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid mobile number is required").max(20),
  dob: z.string().optional(),
  city: z.string().max(120).optional(),
});

export const ticketQuoteValidation = z.object({
  tierCode: z.string().min(1, "Ticket category is required"),
  qty: z.number().int().min(1).max(20),
});

export const ticketOrderCreateValidation = ticketQuoteValidation.extend({
  buyer: ticketBuyerValidation,
});

export const ticketTierUpsertValidation = z.object({
  code: z.string().min(1).max(12),
  name: z.string().min(1).max(60),
  pricePaise: z.number().int().min(0),
  totalQty: z.number().int().min(0),
  status: z.enum(["Active", "SoldOut", "Disabled"]).optional(),
});

export const ticketingConfigValidation = z.object({
  enabled: z.boolean(),
  feePct: z.number().min(0).max(100).optional(),
  feeFlatPaise: z.number().int().min(0).optional(),
  gstPct: z.number().min(0).max(100).optional(),
  maxPerOrder: z.number().int().min(1).max(20).optional(),
}).partial({ enabled: true });
