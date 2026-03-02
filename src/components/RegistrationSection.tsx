"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Send, Loader2, CheckCircle, AlertCircle } from "lucide-react";

// ✅ REMOVED: import { supabase } from "../supabaseClient"
// Now uses /api/register (Vercel server) — fixes DNS issue on Jio/BSNL

const categories = [
  { value: "UG_STUDENT/PG_Student", label: "UG Student / PG Student", amount: 500 },
  { value: "PhD/RESEARCH_SCHOLAR", label: "PhD / Research Scholar", amount: 750 },
  { value: "FACULTY/Academicians", label: "Faculty / Academicians", amount: 1000 },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// ─── Image Compressor ─────────────────────────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size <= 400 * 1024) {
      return resolve(file);
    }

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    img.onload = () => {
      let { width, height } = img;
      const MAX_DIM = 1200;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        0.75
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

const RegistrationSection = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const registrationAmount = selectedCategory
    ? categories.find((c) => c.value === selectedCategory)?.amount
    : null;

  const sanitize = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

  const validateName = (value: string) => /^[A-Za-z\s'-]{2,40}$/.test(value);
  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePhone = (value: string) => /^[+]?[\d\s-]{10,15}$/.test(value);
  const validateCollege = (value: string) => value.length >= 3 && value.length <= 120;
  const validateCategory = (value: string) => categories.some((c) => c.value === value);
  const validateFile = (file: File | null) => {
    if (!file) return false;
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return false;
    if (!ALLOWED_FILE_TYPES.includes(file.type)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);

      const firstName = sanitize(formData.get("first_name"));
      const lastName = sanitize(formData.get("last_name"));
      const email = sanitize(formData.get("email"));
      const phone = sanitize(formData.get("phone"));
      const college = sanitize(formData.get("college"));
      const category = sanitize(formData.get("category"));
      const file = formData.get("college_id") as File | null;

      if (!validateName(firstName)) throw new Error("Please enter a valid first name (letters only).");
      if (!validateName(lastName)) throw new Error("Please enter a valid last name (letters only).");
      if (!validateEmail(email)) throw new Error("Please enter a valid email address.");
      if (!validatePhone(phone)) throw new Error("Please enter a valid phone number.");
      if (!validateCollege(college)) throw new Error("Please enter a valid college/organization name.");
      if (!validateCategory(category)) throw new Error("Please select a valid category.");
      if (!validateFile(file)) throw new Error("Invalid file. Only JPG, PNG, or PDF under 5 MB allowed.");

      // ✅ STEP 1: Compress image on device (reduces size before sending)
      const processedFile = file!.type.startsWith("image/")
        ? await compressImage(file!)
        : file!;

      // ✅ STEP 2: Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(processedFile);
      });

      // ✅ STEP 3: Send to Vercel API route (NOT directly to Supabase)
      // Phone → nfsuquard.vercel.app/api/register → Supabase
      // This bypasses Jio/BSNL DNS blocking of supabase.co
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          college,
          category,
          fileBase64,
          fileName: file!.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed. Please try again.");
      }

      setStatus("success");
    } catch (error) {
      setStatus("error");
      setErrorMsg(
        error instanceof Error ? error.message : "Registration failed. Please try again."
      );
    }
  };

  return (
    <section id="register" className="py-24 relative">
      <div className="section-divider mb-24" />
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-primary uppercase tracking-[0.3em]">
            // Registration
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-extrabold mt-4">
            Secure Your <span className="text-gradient-gold">Spot</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          {status === "success" ? (
            <div className="gold-border rounded-xl p-12 bg-card/30 backdrop-blur-sm text-center">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
              <h3 className="font-heading text-2xl font-bold mb-3">Registration Received!</h3>
              <p className="text-muted-foreground">
                Check your email for confirmation. We'll review your registration and get back to you soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="gold-border rounded-xl p-8 md:p-12 bg-card/30 backdrop-blur-sm space-y-6"
            >
              {status === "error" && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{errorMsg}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">First Name *</label>
                  <input name="first_name" required placeholder="John"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">Last Name *</label>
                  <input name="last_name" required placeholder="Doe"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">Email *</label>
                  <input name="email" type="email" required placeholder="john@example.com"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">Phone *</label>
                  <input name="phone" type="tel" required placeholder="+91 9876543210"
                    className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">College / Organization *</label>
                <input name="college" required placeholder="National Forensics Science University"
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors" />
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">Category *</label>
                <select name="category" required value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/30 border border-border rounded-lg text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {registrationAmount != null && (
                  <p className="mt-3 font-mono text-sm text-primary font-medium">
                    Registration amount: ₹{registrationAmount}
                  </p>
                )}
              </div>

              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                  ID Proof (College/Any Government ID in JPG/PNG/PDF, max 5 MB) *
                </label>
                <input name="college_id" type="file" required accept=".jpg,.jpeg,.png,.pdf"
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-primary/30 file:text-sm file:font-mono file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:transition-colors file:cursor-pointer" />
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <h4 className="font-heading text-sm font-semibold text-primary uppercase tracking-wider">
                  Registration Details
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Registration fee varies by course.</li>
                  <li>After registration, a confirmation email will be sent along with payment details.</li>
                  <li>After verification, registration will be confirmed.</li>
                </ul>
              </div>

              <button type="submit" disabled={status === "loading"}
                className="clip-btn w-full px-10 py-4 bg-primary text-primary-foreground font-heading font-bold text-sm uppercase tracking-widest hover:shadow-[var(--shadow-gold)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {status === "loading" ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="w-5 h-5" />Submit Registration</>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default RegistrationSection;