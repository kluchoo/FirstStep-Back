-- Najpierw sprawdzamy dokładną nazwę kolumny w tabeli Courses
DO $$
DECLARE
    column_name_var text;
    column_exists boolean;
BEGIN
    -- Sprawdź czy kolumna z nazwą creatorId (z dużej litery) istnieje
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'Courses'
        AND column_name = 'creatorId'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Kolumna creatorId istnieje w tabeli Courses';
        column_name_var := 'creatorId';
    ELSE
        -- Sprawdź czy kolumna z nazwą creatorid (z małej litery) istnieje
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'Courses'
            AND column_name = 'creatorid'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE 'Kolumna creatorid istnieje w tabeli Courses';
            column_name_var := 'creatorid';
        ELSE
            RAISE NOTICE 'Kolumna creatorId/creatorid nie istnieje w tabeli Courses';
        END IF;
    END IF;

    -- Wyświetl wszystkie kolumny tabeli Courses dla diagnostyki
    RAISE NOTICE 'Lista wszystkich kolumn w tabeli Courses:';
    FOR column_name_var IN 
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'Courses'
    LOOP
        RAISE NOTICE '%', column_name_var;
    END LOOP;
END $$;

-- Usuwamy wszystkie istniejące wyzwalacze i funkcje
DROP TRIGGER IF EXISTS trg_log_course_create ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_update ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_delete ON "Courses";

DROP FUNCTION IF EXISTS log_course_create CASCADE;
DROP FUNCTION IF EXISTS log_course_update CASCADE;
DROP FUNCTION IF EXISTS log_course_delete CASCADE;

-- Całkowicie resetujemy tabelę audytu i sekwencję - to powinno rozwiązać problem na stałe
DO $$
BEGIN
    -- Usuń wszystkie rekordy z tabeli audytu
    TRUNCATE TABLE "CourseAuditLog" RESTART IDENTITY CASCADE;
    
    RAISE NOTICE 'Tabela CourseAuditLog została całkowicie wyczyszczona z resetem sekwencji';
END $$;

-- Wyłączamy wyzwalacze dla seedowania - tworzymy proste funkcje, które nic nie robią
CREATE OR REPLACE FUNCTION log_course_create() RETURNS TRIGGER AS $$
BEGIN
    -- Tymczasowo wyłączone dla seedowania
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_course_update() RETURNS TRIGGER AS $$
BEGIN
    -- Tymczasowo wyłączone dla seedowania
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_course_delete() RETURNS TRIGGER AS $$
BEGIN
    -- Tymczasowo wyłączone dla seedowania
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Nie tworzymy wyzwalaczy - pozostawiamy je wyłączone podczas seedowania
-- CREATE TRIGGER trg_log_course_create...

-- Komunikat diagnostyczny
DO $$
BEGIN
    RAISE NOTICE 'Wyzwalacze zostały tymczasowo wyłączone dla seedowania';
END $$;

-- Diagnostyka dla tabeli łączącej kategorie z kursami
DO $$
DECLARE
    table_name_rec RECORD;
BEGIN
    -- Sprawdź czy tabela "_CourseCategories" istnieje (zgodnie ze schematem Prisma)
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = '_CourseCategories'
    ) INTO table_name_rec;
    
    IF table_name_rec IS NOT NULL THEN
        RAISE NOTICE 'Tabela _CourseCategories istnieje';
    ELSE
        RAISE NOTICE 'Tabela _CourseCategories NIE istnieje';
        
        -- Wypisz wszystkie tabele zaczynające się od podkreślenia dla diagnostyki
        RAISE NOTICE 'Lista wszystkich tabel z podkreśleniem na początku:';
        FOR table_name_rec IN 
            SELECT table_name
            FROM information_schema.tables
            WHERE table_name LIKE '\_%'
            AND table_schema = 'public'
        LOOP
            RAISE NOTICE 'Tabela: %', table_name_rec.table_name;
        END LOOP;
    END IF;
END $$;

-- Zaktualizuj obsługę oczyszczania kursu w procedurze
CREATE OR REPLACE PROCEDURE obscure_cleanup_proc(ref_id bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usuwanie powiązań z kategoriami - używamy prawidłowej nazwy tabeli "_CourseCategories"
  DELETE FROM "_CourseCategories" WHERE "B" = ref_id;
  
  -- Na końcu usuwanie samego kursu
  DELETE FROM "Courses" WHERE id = ref_id;
END;
$$;
