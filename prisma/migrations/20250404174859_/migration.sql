/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CourseImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Rola" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- CreateEnum
CREATE TYPE "PoziomTrudnosci" AS ENUM ('PODSTAWOWY', 'SREDNIOZAAWANSOWANY', 'ZAAWANSOWANY');

-- CreateEnum
CREATE TYPE "StatusKursu" AS ENUM ('WERSJA_ROBOCZA', 'OPUBLIKOWANY', 'ZARCHIWIZOWANY');

-- CreateEnum
CREATE TYPE "TypPytania" AS ENUM ('JEDNOKROTNY_WYBOR', 'WIELOKROTNY_WYBOR', 'PRAWDA_FALSZ');

-- CreateEnum
CREATE TYPE "TypElementu" AS ENUM ('NAGLOWEK', 'TEKST', 'OBRAZ', 'WIDEO', 'PLIK', 'KOD');

-- CreateEnum
CREATE TYPE "StatusZapisu" AS ENUM ('AKTYWNY', 'UKONCZONY', 'PORZUCONY');

-- CreateEnum
CREATE TYPE "StatusWyniku" AS ENUM ('W_TRAKCIE', 'ZAKONCZONY', 'OCENIONY');

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_idTworcy_fkey";

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_kategorie_fkey";

-- DropForeignKey
ALTER TABLE "CourseImage" DROP CONSTRAINT "CourseImage_idTworcy_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_idTworcy_fkey";

-- DropTable
DROP TABLE "Category";

-- DropTable
DROP TABLE "Course";

-- DropTable
DROP TABLE "CourseImage";

-- DropTable
DROP TABLE "Test";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "uzytkownicy" (
    "id" BIGSERIAL NOT NULL,
    "pseudonim" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "haslo" VARCHAR(255) NOT NULL,
    "data_ostatniego_logowania" TIMESTAMP,
    "rola" "Rola" NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT "uzytkownicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategorie" (
    "id" BIGSERIAL NOT NULL,
    "nazwa" VARCHAR(100) NOT NULL,
    "opis" TEXT,

    CONSTRAINT "kategorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kursy" (
    "id" BIGSERIAL NOT NULL,
    "id_tworcy" BIGINT NOT NULL,
    "id_kategorii" BIGINT NOT NULL,
    "id_testu" BIGINT,
    "tytul" VARCHAR(255) NOT NULL,
    "opis" TEXT,
    "poziom_trudnosci" "PoziomTrudnosci" NOT NULL,
    "data_utworzenia" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_modyfikacji" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liczba_studentow" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusKursu" NOT NULL DEFAULT 'WERSJA_ROBOCZA',

    CONSTRAINT "kursy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testy" (
    "id" BIGSERIAL NOT NULL,
    "id_tworcy" BIGINT NOT NULL,
    "id_kursu" BIGINT NOT NULL,
    "tytul" VARCHAR(255) NOT NULL,
    "czas_trwania" INTEGER NOT NULL,
    "data_utworzenia" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kursyId" BIGINT NOT NULL,

    CONSTRAINT "testy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pytania_testowe" (
    "id" BIGSERIAL NOT NULL,
    "id_testu" BIGINT NOT NULL,
    "tresc" TEXT NOT NULL,
    "typ_pytania" "TypPytania" NOT NULL,
    "punkty" INTEGER NOT NULL DEFAULT 1,
    "kolejnosc" INTEGER NOT NULL,

    CONSTRAINT "pytania_testowe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odpowiedzi" (
    "id" BIGSERIAL NOT NULL,
    "id_pytania" BIGINT NOT NULL,
    "tresc" TEXT NOT NULL,
    "czy_poprawna" BOOLEAN NOT NULL DEFAULT false,
    "kolejnosc" INTEGER NOT NULL,

    CONSTRAINT "odpowiedzi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elementy_kursu" (
    "id" BIGSERIAL NOT NULL,
    "id_kursu" BIGINT NOT NULL,
    "typ" "TypElementu" NOT NULL,
    "tresc" TEXT NOT NULL,
    "kolejnosc" INTEGER NOT NULL,
    "dodatkowe_dane" JSONB,

    CONSTRAINT "elementy_kursu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zapisy_na_kursy" (
    "id" BIGSERIAL NOT NULL,
    "id_kursu" BIGINT NOT NULL,
    "id_uzytkownika" BIGINT NOT NULL,
    "data_zapisu" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusZapisu" NOT NULL DEFAULT 'AKTYWNY',
    "postep" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "zapisy_na_kursy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wyniki_testow" (
    "id" BIGSERIAL NOT NULL,
    "id_testu" BIGINT NOT NULL,
    "id_uzytkownika" BIGINT NOT NULL,
    "wynik" INTEGER NOT NULL,
    "data_rozpoczecia" TIMESTAMP NOT NULL,
    "data_zakonczenia" TIMESTAMP,
    "status" "StatusWyniku" NOT NULL DEFAULT 'W_TRAKCIE',

    CONSTRAINT "wyniki_testow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uzytkownicy_email_key" ON "uzytkownicy"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kategorie_nazwa_key" ON "kategorie"("nazwa");

-- CreateIndex
CREATE UNIQUE INDEX "testy_kursyId_key" ON "testy"("kursyId");

-- CreateIndex
CREATE UNIQUE INDEX "zapisy_na_kursy_id_kursu_id_uzytkownika_key" ON "zapisy_na_kursy"("id_kursu", "id_uzytkownika");

-- AddForeignKey
ALTER TABLE "kursy" ADD CONSTRAINT "kursy_id_tworcy_fkey" FOREIGN KEY ("id_tworcy") REFERENCES "uzytkownicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kursy" ADD CONSTRAINT "kursy_id_kategorii_fkey" FOREIGN KEY ("id_kategorii") REFERENCES "kategorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testy" ADD CONSTRAINT "testy_id_tworcy_fkey" FOREIGN KEY ("id_tworcy") REFERENCES "uzytkownicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testy" ADD CONSTRAINT "testy_kursyId_fkey" FOREIGN KEY ("kursyId") REFERENCES "kursy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pytania_testowe" ADD CONSTRAINT "pytania_testowe_id_testu_fkey" FOREIGN KEY ("id_testu") REFERENCES "testy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odpowiedzi" ADD CONSTRAINT "odpowiedzi_id_pytania_fkey" FOREIGN KEY ("id_pytania") REFERENCES "pytania_testowe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elementy_kursu" ADD CONSTRAINT "elementy_kursu_id_kursu_fkey" FOREIGN KEY ("id_kursu") REFERENCES "kursy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zapisy_na_kursy" ADD CONSTRAINT "zapisy_na_kursy_id_kursu_fkey" FOREIGN KEY ("id_kursu") REFERENCES "kursy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zapisy_na_kursy" ADD CONSTRAINT "zapisy_na_kursy_id_uzytkownika_fkey" FOREIGN KEY ("id_uzytkownika") REFERENCES "uzytkownicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wyniki_testow" ADD CONSTRAINT "wyniki_testow_id_testu_fkey" FOREIGN KEY ("id_testu") REFERENCES "testy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wyniki_testow" ADD CONSTRAINT "wyniki_testow_id_uzytkownika_fkey" FOREIGN KEY ("id_uzytkownika") REFERENCES "uzytkownicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
