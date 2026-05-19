const SUPABASE_URL =
"https://jlthvgtkkisnsddaxaoy.supabase.co";

const SUPABASE_KEY =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsdGh2Z3Rra2lzbnNkZGF4YW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0ODgwNjksImV4cCI6MjA5NDA2NDA2OX0.1CnBaISs_d1zjJiS-lhH2osah677U_i1NsnJ-1K7D_A";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  const GOOGLE_SHEET_TEMP_URL =
  "https://script.google.com/macros/s/AKfycbzvlx-iFPNDCqdAjyt8lU3t7U9oINy4652A_PI5RPSpZx8LYNfJ0-gR-qTPDRjIqYY/exec?action=getSignaturesForSupabase";