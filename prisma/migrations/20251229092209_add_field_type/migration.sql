-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StageField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "stageId" TEXT NOT NULL,
    CONSTRAINT "StageField_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StageField" ("id", "label", "stageId", "value") SELECT "id", "label", "stageId", "value" FROM "StageField";
DROP TABLE "StageField";
ALTER TABLE "new_StageField" RENAME TO "StageField";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
