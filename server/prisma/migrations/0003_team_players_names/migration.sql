-- Add playerNames column for denormalized player name list
ALTER TABLE "TeamPlayers"
ADD COLUMN "playerNames" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill playerNames from existing players JSON
UPDATE "TeamPlayers" tp
SET "playerNames" = COALESCE(
  (
    SELECT jsonb_agg(elem->>'name')
    FROM jsonb_array_elements(tp."players") elem
    WHERE jsonb_typeof(elem) = 'object'
      AND elem ? 'name'
      AND btrim(COALESCE(elem->>'name', '')) <> ''
  ),
  '[]'::jsonb
);
