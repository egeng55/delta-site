/**
 * Supabase Client Configuration for Website
 *
 * Uses the same Supabase project as the mobile app.
 * This ensures auth state and data are shared across platforms.
 */

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Same Supabase project as mobile app
const SUPABASE_URL = 'https://fhbfaoowwnzzynhbgcms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYmZhb293d256enluaGJnY21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTQxOTcsImV4cCI6MjA4NDUzMDE5N30.tLvdwDBL9ftVq-xb2C9UCm4MXb8r2owNMlSL_G_iM8k';

// Browser client for client-side usage
export function createSupabaseBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Simple client for direct usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Database types
export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'developer' | 'admin';
  created_at: string;
  updated_at: string;
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
