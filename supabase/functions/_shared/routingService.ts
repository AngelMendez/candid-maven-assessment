// Define our partner URLs in a single place
const PARTNER_APIS = {
  EDU: "https://api.example.com/educate",
  FIN: "https://api.example.com/finance",
  INS: "https://api.example.com/insurance", // Used as fallback
};

// Interface for the lead data we need for routing
interface LeadData {
  [key: string]: any; // Allows any field
}

interface RoutingRule {
  conditions: Record<string, any>;
  partner_api_url: string;
  partner_name: string;
}

/**
 * Finds the first rule that matches the lead data.
 * @param lead - The lead data.
 * @param rules - A list of active rules, sorted by priority.
 * @returns The matching rule, or null if none match.
 */
function findMatchingRule(
  lead: LeadData,
  rules: RoutingRule[]
): RoutingRule | null {
  for (const rule of rules) {
    const conditions = rule.conditions;
    // every() returns true if the lead meets ALL the rule's conditions
    const isMatch = Object.keys(conditions).every(
      (key) => lead[key] === conditions[key]
    );
    if (isMatch) {
      return rule; // We found the first match!
    }
  }
  return null; // No rule matched
}

/**
 * Gets the correct partner API by querying the dynamic rules in the DB.
 * @param supabaseClient - The Supabase client to make the query.
 * @param lead - The lead data.
 * @returns An object with the URL and name of the partner API.
 */
export async function getPartnerApiFromRules(
  supabaseClient: SupabaseClient,
  lead: LeadData
): Promise<{ url: string; name: string }> {
  const { data: rules, error } = await supabaseClient
    .from("routing_rules")
    .select("conditions, partner_api_url, partner_name")
    .eq("is_active", true)
    .order("priority", { ascending: true });

console.log({rules})

  if (error) throw new Error("Could not fetch routing rules");
  if (!rules || rules.length === 0)
    throw new Error("No active routing rules found");

  const matchingRule = findMatchingRule(lead, rules);

  if (matchingRule) {
    return {
      url: matchingRule.partner_api_url,
      name: matchingRule.partner_name,
    };
  }

  // If no specific rule matches, we look for the fallback one (empty conditions)
  const fallbackRule = rules.find(
    (r) => Object.keys(r.conditions).length === 0
  );
  if (!fallbackRule) throw new Error("No fallback rule configured");

  return { url: fallbackRule.partner_api_url, name: fallbackRule.partner_name };
}

/**
 * Determines the correct partner API based on business rules.
 * @param lead - The lead data.
 * @returns The URL of the partner API to which the lead should be sent.
 */
export function getPartnerApi(lead: LeadData): string {
  // Rule 1: Interest in Education [cite: 26]
  if (lead.interest === "Education") {
    return PARTNER_APIS.EDU;
  }

  // Rule 2: Interest in Finance and from the US [cite: 27]
  if (lead.interest === "Finance" && lead.country === "US") {
    return PARTNER_APIS.FIN;
  }

  // Rule 3: Fallback for all other cases [cite: 28]
  return PARTNER_APIS.INS;
}
