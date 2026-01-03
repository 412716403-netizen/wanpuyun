-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "colorsJson" TEXT NOT NULL DEFAULT '[]',
    "sizesJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'developing',
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("code", "color", "colorsJson", "createdAt", "id", "image", "isSynced", "name", "size", "sizesJson", "status", "updatedAt") SELECT "code", "color", "colorsJson", "createdAt", "id", "image", "isSynced", "name", "size", "sizesJson", "status", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE TABLE "new_StageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_StageTemplate" ("createdAt", "id", "name", "order") SELECT "createdAt", "id", "name", "order" FROM "StageTemplate";
DROP TABLE "StageTemplate";
ALTER TABLE "new_StageTemplate" RENAME TO "StageTemplate";
CREATE UNIQUE INDEX "StageTemplate_tenantId_name_key" ON "StageTemplate"("tenantId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
