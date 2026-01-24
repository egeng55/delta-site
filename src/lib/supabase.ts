/**
 * Supabase Client Configuration for Website
 *
 * Uses the same Supabase project as the mobile app.
 * This ensures auth state and data are shared across platforms.
 */

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client for client-side usage
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Simple client for direct usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database types - must match Supabase schema exactly
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'non-binary' | 'other' | null;
  role: 'user' | 'developer' | 'admin';
  created_at: string;
  updated_at: string;
}

// Fields that users can update on their profile
export interface ProfileUpdate {
  name?: string | null;
  username?: string | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'non-binary' | 'other' | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'expired' | 'trialing';
  source: 'web' | 'ios' | 'android' | 'manual';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  canceled_at: string | null;
  stripe_subscription_id: string | null;
}

// Developer emails that bypass subscription checks
export const DEVELOPER_EMAILS = ['egeng@umich.edu', 'eric@egeng.co'];

// Check if an email has developer access
export function isDeveloperEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEVELOPER_EMAILS.includes(email.toLowerCase());
}
