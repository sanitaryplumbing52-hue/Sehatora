import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

export const emailSchema = z.string().trim().min(1, 'Enter your email.').email('Enter a valid email address.');

/**
 * Client-side hint only — the API is authoritative (it also rejects IPs, private hosts and
 * duplicates). Accepts "example.com" or a full http(s) URL.
 */
export const websiteUrlSchema = z
  .string()
  .trim()
  .min(1, 'Enter your website address.')
  .refine((v) => {
    const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`;
    try {
      const u = new URL(candidate);
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname);
    } catch {
      return false;
    }
  }, 'Enter a valid website address, e.g. example.com.');
