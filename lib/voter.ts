const VOTER_KEY = "sp_voter_id";

/**
 * Get or create a persistent anonymous voter ID using localStorage.
 * This allows anonymous participants to vote once per soiree.
 *
 * When a salleSlug is provided, the voter ID is scoped to that salle,
 * ensuring vote isolation between different private cinemas.
 *
 * - On the server (SSR), returns an empty string since localStorage is unavailable.
 * - On the client, reads from localStorage or generates a new UUID and persists it.
 *
 * @param salleSlug - Optional salle slug to scope the voter ID per salle.
 * @returns A UUID string identifying the current voter, or "" on the server.
 */
export function getVoterId(salleSlug?: string): string {
  if (typeof window === "undefined") return "";

  const key = salleSlug ? `${VOTER_KEY}_${salleSlug}` : VOTER_KEY;
  let voterId = localStorage.getItem(key);
  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(key, voterId);
  }
  return voterId;
}
