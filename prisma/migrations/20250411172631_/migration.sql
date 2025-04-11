-- AlterTable
ALTER TABLE "CourseElements" ALTER COLUMN "order" DROP DEFAULT;
DROP SEQUENCE "courseelements_order_seq";

-- CreateTable
CREATE TABLE "CourseElementOrder" (
    "courseId" BIGINT NOT NULL,
    "lastOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CourseElementOrder_pkey" PRIMARY KEY ("courseId")
);

-- AddForeignKey
ALTER TABLE "CourseElementOrder" ADD CONSTRAINT "CourseElementOrder_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
