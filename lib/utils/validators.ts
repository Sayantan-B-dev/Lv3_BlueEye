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
