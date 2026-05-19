const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function getCompanies() {

  const { data, error } = await client
    .from("companies")
    .select("*");

  if (error) {
    console.error("Erreur Supabase:", error);
    return [];
  }

  return data;
}
async function getAgents(compagnie) {

  const { data, error } = await client
    .from("agents")
    .select("*")
    .eq("compagnie", compagnie);

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}