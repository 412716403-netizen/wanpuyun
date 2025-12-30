-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stageId" TEXT NOT NULL,
    CONSTRAINT "Attachment_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "StageTemplate_name_key" ON "StageTemplate"("name");
