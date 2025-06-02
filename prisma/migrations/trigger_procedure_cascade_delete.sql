-- Specjalna procedura do czyszczenia powiązań dla wybranej jednostki
CREATE OR REPLACE PROCEDURE obscure_cleanup_proc(ref_id bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM "TestAnswers" WHERE "questionId" IN (SELECT id FROM "TestQuestions" WHERE "testId" IN (SELECT id FROM "Tests" WHERE "courseId" = ref_id));
  DELETE FROM "ElementsStyle" WHERE "courseElementId" IN (SELECT id FROM "CourseElements" WHERE "courseId" = ref_id);
  DELETE FROM "TestQuestions" WHERE "testId" IN (SELECT id FROM "Tests" WHERE "courseId" = ref_id);
  DELETE FROM "TestResults" WHERE "testId" IN (SELECT id FROM "Tests" WHERE "courseId" = ref_id);
  DELETE FROM "Tests" WHERE "courseId" = ref_id;
  DELETE FROM "CourseElements" WHERE "courseId" = ref_id;
  DELETE FROM "Enrollments" WHERE "courseId" = ref_id;
  DELETE FROM "CourseElementOrder" WHERE "courseId" = ref_id;
  -- Poprawiona nazwa tabeli łączącej na "_CourseCategories" zgodnie ze schematem Prisma
  DELETE FROM "_CourseCategories" WHERE "B" = ref_id;
  DELETE FROM "Courses" WHERE id = ref_id;
END;
$$;

-- Tabela do logowania operacji na kursach
CREATE TABLE IF NOT EXISTS "CourseAuditLog" (
  id SERIAL PRIMARY KEY,
  course_id bigint,
  action_type VARCHAR(20) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usuwanie istniejących funkcji wyzwalaczy
DROP FUNCTION IF EXISTS log_course_create CASCADE;
DROP FUNCTION IF EXISTS log_course_update CASCADE;
DROP FUNCTION IF EXISTS log_course_delete CASCADE;

-- Wyczyśćmy tabelę audytu całkowicie z resetem sekwencji
DO $$
BEGIN
    -- Usuń wszystkie rekordy z tabeli audytu i resetuj sekwencję
    TRUNCATE TABLE "CourseAuditLog" RESTART IDENTITY CASCADE;
    
    RAISE NOTICE 'Tabela CourseAuditLog została całkowicie wyczyszczona z resetem sekwencji';
END $$;

-- Tworzymy puste funkcje wyzwalaczy (wyłączone dla seedowania)
CREATE OR REPLACE FUNCTION log_course_create() RETURNS TRIGGER AS $$
BEGIN
  -- Wyłączone na czas seedowania
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_course_update() RETURNS TRIGGER AS $$
BEGIN
  -- Wyłączone na czas seedowania
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_course_delete() RETURNS TRIGGER AS $$
BEGIN
  -- Wyłączone na czas seedowania
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Nie tworzymy wyzwalaczy na tym etapie
-- Usuwanie triggerów jeśli istnieją
DROP TRIGGER IF EXISTS trg_log_course_create ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_update ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_delete ON "Courses";

-- Procedura do pobierania statystyk kursu
CREATE OR REPLACE FUNCTION get_course_statistics(course_id bigint)
RETURNS TABLE (
  student_count bigint,
  element_count bigint,
  test_count bigint,
  avg_test_score decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM "Enrollments" WHERE "courseId" = course_id) as student_count,
    (SELECT COUNT(*) FROM "CourseElements" WHERE "courseId" = course_id) as element_count,
    (SELECT COUNT(*) FROM "Tests" WHERE "courseId" = course_id) as test_count,
    (SELECT COALESCE(AVG(result), 0) FROM "TestResults" 
     WHERE "testId" IN (SELECT id FROM "Tests" WHERE "courseId" = course_id)) as avg_test_score;
END;
$$ LANGUAGE plpgsql;
