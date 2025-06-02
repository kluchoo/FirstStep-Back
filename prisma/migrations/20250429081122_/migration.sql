/*
  Warnings:

  - The values [CODE] on the enum `ElementType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElementType_new" AS ENUM ('HEADER', 'TEXT', 'IMAGE', 'VIDEO');
ALTER TABLE "CourseElements" ALTER COLUMN "type" TYPE "ElementType_new" USING ("type"::text::"ElementType_new");
ALTER TYPE "ElementType" RENAME TO "ElementType_old";
ALTER TYPE "ElementType_new" RENAME TO "ElementType";
DROP TYPE "ElementType_old";
COMMIT;
