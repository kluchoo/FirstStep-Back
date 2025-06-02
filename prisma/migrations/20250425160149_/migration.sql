/*
  Warnings:

  - The values [VIDEO,FILE] on the enum `ElementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElementType_new" AS ENUM ('HEADER', 'TEXT', 'IMAGE', 'CODE');
ALTER TABLE "CourseElements" ALTER COLUMN "type" TYPE "ElementType_new" USING ("type"::text::"ElementType_new");
ALTER TYPE "ElementType" RENAME TO "ElementType_old";
ALTER TYPE "ElementType_new" RENAME TO "ElementType";
DROP TYPE "ElementType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Courses" DROP CONSTRAINT "Courses_categoryId_fkey";

-- CreateTable
CREATE TABLE "_CourseCategories" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL,

    CONSTRAINT "_CourseCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseCategories_B_index" ON "_CourseCategories"("B");

-- AddForeignKey
ALTER TABLE "_CourseCategories" ADD CONSTRAINT "_CourseCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseCategories" ADD CONSTRAINT "_CourseCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
