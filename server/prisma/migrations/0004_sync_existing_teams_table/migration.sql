-- Ensure the existing Supabase Teams table has the expected columns
CREATE TABLE IF NOT EXISTS "Teams" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "players" JSONB NOT NULL,
    "playerNames" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Teams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Teams_teamName_key" ON "Teams"("teamName");

ALTER TABLE "Teams"
ADD COLUMN IF NOT EXISTS "playerNames" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill playerNames in existing Teams rows
UPDATE "Teams" t
SET "playerNames" = COALESCE(
  (
    SELECT jsonb_agg(elem->>'name')
    FROM jsonb_array_elements(t."players") elem
    WHERE jsonb_typeof(elem) = 'object'
      AND elem ? 'name'
      AND btrim(COALESCE(elem->>'name', '')) <> ''
  ),
  '[]'::jsonb
);

-- Keep existing TeamPlayers data visible in the Teams table the user watches in Supabase
INSERT INTO "Teams" ("id", "teamName", "players", "playerNames", "updatedAt")
SELECT tp."id", tp."teamName", tp."players", tp."playerNames", tp."updatedAt"
FROM "TeamPlayers" tp
ON CONFLICT ("teamName") DO UPDATE SET
  "players" = EXCLUDED."players",
  "playerNames" = EXCLUDED."playerNames",
  "updatedAt" = EXCLUDED."updatedAt";
