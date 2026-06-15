import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * Build a SQL WHERE clause for full-text search across knowledge objects.
 * Uses PostgreSQL ILIKE for fuzzy matching (tsvector optimization deferred).
 */
export function searchQuery(q: string): SQL {
  // Escape special LIKE characters
  const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const likePattern = `%${safe}%`;

  return sql`(
    title ILIKE ${likePattern}
    OR description ILIKE ${likePattern}
    OR EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ILIKE ${likePattern})
  )`;
}
