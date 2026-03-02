// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_REGISTRATIONS = 22;

export const VALID_CATEGORIES = [
  "UG_STUDENT/PG_Student",
  "PhD/RESEARCH_SCHOLAR",
  "FACULTY/Academicians",
] as const;

export type ValidCategory = (typeof VALID_CATEGORIES)[number];

// ─── Form Field Validators ────────────────────────────────────────────────────

/** First / Last name: letters, spaces, hyphens, apostrophes — 2 to 40 chars */
export const validateName = (value: string): boolean =>
  /^[A-Za-z\s'-]{2,40}$/.test(value);

/** Standard email format */
export const validateEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

/** Phone: optional leading +, digits/spaces/hyphens — 10 to 15 chars */
export const validatePhone = (value: string): boolean =>
  /^[+]?[\d\s-]{10}$/.test(value);

/** College / organization: 3 to 120 chars */
export const validateCollege = (value: string): boolean =>
  value.length >= 3 && value.length <= 120;

/** Category must be one of the known enum values */
export const validateCategory = (value: string): boolean =>
  (VALID_CATEGORIES as readonly string[]).includes(value);

/** File: must exist, non-empty, within size limit, and an allowed MIME type */
export const validateFile = (file: File | null): boolean =>
  !!file &&
  file.size > 0 &&
  file.size <= MAX_FILE_SIZE &&
  ALLOWED_FILE_TYPES.includes(file.type);

// ─── Sanitization ─────────────────────────────────────────────────────────────

/** Trims whitespace; returns empty string for non-string values */
export const sanitize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// ─── Full Form Validation ─────────────────────────────────────────────────────

export interface FormFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  college: string;
  category: string;
  file: File | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates all registration form fields in order.
 * Returns { valid: true } if all pass, or { valid: false, error: "..." }
 * on the first failure.
 */
export function validateRegistrationForm(fields: FormFields): ValidationResult {
  const { firstName, lastName, email, phone, college, category, file } = fields;

  if (!validateName(firstName))
    return { valid: false, error: "Please enter a valid first name." };

  if (!validateName(lastName))
    return { valid: false, error: "Please enter a valid last name." };

  if (!validateEmail(email))
    return { valid: false, error: "Please enter a valid email address." };

  if (!validatePhone(phone))
    return { valid: false, error: "Please enter a valid phone number." };

  if (!validateCollege(college))
    return { valid: false, error: "Please enter a valid college/organization." };

  if (!validateCategory(category))
    return { valid: false, error: "Please select a valid category." };

  if (!validateFile(file))
    return { valid: false, error: "Invalid file. Only JPG, PNG, PDF under 5MB allowed." };

  return { valid: true };
}

// ─── Server-side / API Validators ────────────────────────────────────────────

export interface ApiFields {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  college?: unknown;
  category?: unknown;
  id_proof_url?: unknown;
}

/**
 * Validates that all required text fields are present and non-empty
 * in the JSON body received by the API route.
 */
export function validateApiPayload(fields: ApiFields): ValidationResult {
  const { first_name, last_name, email, phone, college, category, id_proof_url } = fields;

  if (!first_name || !last_name || !email || !phone || !college || !category || !id_proof_url)
    return { valid: false, error: "All fields are required." };

  if (!validateName(sanitize(first_name)))
    return { valid: false, error: "Invalid first name." };

  if (!validateName(sanitize(last_name)))
    return { valid: false, error: "Invalid last name." };

  if (!validateEmail(sanitize(String(email)).toLowerCase()))
    return { valid: false, error: "Invalid email address." };

  if (!validatePhone(sanitize(phone)))
    return { valid: false, error: "Invalid phone number." };

  if (!validateCollege(sanitize(college)))
    return { valid: false, error: "Invalid college/organization." };

  if (!validateCategory(sanitize(category)))
    return { valid: false, error: "Invalid category." };

  return { valid: true };
}

// ─── Supabase / DB Validators ─────────────────────────────────────────────────

/**
 * Checks whether the registration cap has been reached.
 * Pass in the current count from Supabase.
 */
export function validateRegistrationLimit(currentCount: number): ValidationResult {
  if (currentCount >= MAX_REGISTRATIONS)
    return {
      valid: false,
      error: `Registration is full. Maximum ${MAX_REGISTRATIONS} registrations reached.`,
    };

  return { valid: true };
}

/**
 * Checks that a Supabase Storage upload path is a safe, non-empty string
 * (no path traversal, no suspicious characters).
 */
export function validateStoragePath(path: string): ValidationResult {
  if (!path || path.trim().length === 0)
    return { valid: false, error: "Storage path is empty." };

  if (/[\\]|\.\./.test(path))
    return { valid: false, error: "Storage path contains invalid characters." };

  return { valid: true };
}

/**
 * Validates a file before uploading to Supabase Storage from the client.
 * Same rules as the form-level file validator — exported separately for
 * clarity when called from the service layer.
 */
export function validateUploadFile(file: File | null): ValidationResult {
  if (!file)
    return { valid: false, error: "No file provided." };

  if (file.size === 0)
    return { valid: false, error: "File is empty." };

  if (file.size > MAX_FILE_SIZE)
    return { valid: false, error: `File exceeds the 5MB size limit.` };

  if (!ALLOWED_FILE_TYPES.includes(file.type))
    return { valid: false, error: "Only JPG, PNG, and PDF files are allowed." };

  return { valid: true };
}
