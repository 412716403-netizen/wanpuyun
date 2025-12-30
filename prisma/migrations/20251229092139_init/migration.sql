-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'developing',
    "isSynced" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductCustomField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "ProductCustomField_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SampleVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,
    CONSTRAINT "SampleVersion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "sampleId" TEXT NOT NULL,
    CONSTRAINT "Stage_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "SampleVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StageField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    CONSTRAINT "StageField_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sampleId" TEXT NOT NULL,
    CONSTRAINT "Log_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "SampleVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
