import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "Faltan las variables VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env"
  );
}

export const supabase = createClient(url, anonKey);
