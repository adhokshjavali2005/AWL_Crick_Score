-- CreateTable
CREATE TABLE "Team" (
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("name")
);

-- Backfill from TeamPlayers and Match table names
INSERT INTO "Team" ("name", "createdAt", "updatedAt")
SELECT DISTINCT x.name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT "teamName" AS name FROM "TeamPlayers"
  UNION ALL
  SELECT "teamAName" AS name FROM "Match"
  UNION ALL
  SELECT "teamBName" AS name FROM "Match"
) x
WHERE x.name IS NOT NULL
  AND btrim(x.name) <> ''
ON CONFLICT ("name") DO NOTHING;
