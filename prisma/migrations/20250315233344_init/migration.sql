-- CreateTable
CREATE TABLE "User" (
    "id" BIGSERIAL NOT NULL,
    "pseudonim" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "haslo" VARCHAR(255) NOT NULL,
    "dataOstatniegoLogowania" TIMESTAMP(3),
    "iloscKursow" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" BIGSERIAL NOT NULL,
    "idTworcy" BIGINT NOT NULL,
    "tresc" JSONB NOT NULL,
    "kategorie" VARCHAR(100) NOT NULL,
    "poziomTrudnosci" VARCHAR(50) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" BIGSERIAL NOT NULL,
    "nazwa" VARCHAR(100) NOT NULL,
    "iloscKursow" INTEGER NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" BIGSERIAL NOT NULL,
    "idTworcy" BIGINT NOT NULL,
    "iloscPytan" INTEGER NOT NULL,
    "pytania" JSONB NOT NULL,
    "odpowiedzi" JSONB NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseImage" (
    "id" BIGSERIAL NOT NULL,
    "idTworcy" BIGINT NOT NULL,
    "zdjecie" BYTEA NOT NULL,

    CONSTRAINT "CourseImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_nazwa_key" ON "Category"("nazwa");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_idTworcy_fkey" FOREIGN KEY ("idTworcy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_kategorie_fkey" FOREIGN KEY ("kategorie") REFERENCES "Category"("nazwa") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_idTworcy_fkey" FOREIGN KEY ("idTworcy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseImage" ADD CONSTRAINT "CourseImage_idTworcy_fkey" FOREIGN KEY ("idTworcy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
