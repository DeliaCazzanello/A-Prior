import { createBrowserClient } from "@supabase/ssr";

// Safely extract variables from Vite's env object
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Throw a helpful error if setup is incomplete
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);