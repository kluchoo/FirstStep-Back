/*
  Warnings:

  - You are about to drop the column `progress` on the `Enrollments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Enrollments" DROP COLUMN "progress";

-- CreateTable
CREATE TABLE "ElementsStyle" (
    "id" BIGSERIAL NOT NULL,
    "courseElementId" BIGINT NOT NULL,
    "isBold" BOOLEAN NOT NULL DEFAULT false,
    "isItalic" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(20),
    "fontSize" DOUBLE PRECISION,
    "isUnderline" BOOLEAN NOT NULL DEFAULT false,
    "hasHighlight" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ElementsStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElementsStyle_courseElementId_idx" ON "ElementsStyle"("courseElementId");

-- AddForeignKey
ALTER TABLE "ElementsStyle" ADD CONSTRAINT "ElementsStyle_courseElementId_fkey" FOREIGN KEY ("courseElementId") REFERENCES "CourseElements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
