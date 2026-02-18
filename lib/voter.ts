const VOTER_KEY = "sp_voter_id";

/**
 * Get or create a persistent anonymous voter ID using localStorage.
 * This allows anonymous participants to vote once per soiree.
 */
export function getVoterId(): string {
  if (typeof window === "undefined") return "";

  let voterId = localStorage.getItem(VOTER_KEY);
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, voterId);
  }
  return voterId;
}
