/*
  Warnings:

  - You are about to drop the `Answers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Answers" DROP CONSTRAINT "Answers_questionId_fkey";

-- DropTable
DROP TABLE "Answers";

-- CreateTable
CREATE TABLE "TestAnswers" (
    "id" BIGSERIAL NOT NULL,
    "questionId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TestAnswers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestAnswers" ADD CONSTRAINT "TestAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "TestQuestions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
