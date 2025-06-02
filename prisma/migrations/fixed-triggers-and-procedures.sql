-- Najpierw usuwamy istniejące wyzwalacze i funkcje
DROP TRIGGER IF EXISTS trg_log_course_create ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_update ON "Courses";
DROP TRIGGER IF EXISTS trg_log_course_delete ON "Courses";

DROP FUNCTION IF EXISTS log_course_create() CASCADE;
DROP FUNCTION IF EXISTS log_course_update() CASCADE;
DROP FUNCTION IF EXISTS log_course_delete() CASCADE;
DROP FUNCTION IF EXISTS get_course_statistics(bigint) CASCADE;

DROP PROCEDURE IF EXISTS obscure_cleanup_proc CASCADE;

-- Specjalna procedura do czyszczenia powiązań dla wybranej jednostki
CREATE OR REPLACE PROCEDURE obscure_cleanup_proc(ref_id bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usuwanie testów i powiązanych danych
  DELETE FROM "TestAnswers" WHERE "questionId" IN (
    SELECT id FROM "TestQuestions" WHERE "testId" IN (
      SELECT id FROM "Tests" WHERE "courseId" = ref_id
    )
  );
  
  -- Usuwanie stylów elementów
  DELETE FROM "ElementsStyle" WHERE "courseElementId" IN (
    SELECT id FROM "CourseElements" WHERE "courseId" = ref_id
  );
  
  -- Usuwanie pytań testowych
  DELETE FROM "TestQuestions" WHERE "testId" IN (
    SELECT id FROM "Tests" WHERE "courseId" = ref_id
  );
  
  -- Usuwanie wyników testów
  DELETE FROM "TestResults" WHERE "testId" IN (
    SELECT id FROM "Tests" WHERE "courseId" = ref_id
  );
  
  -- Usuwanie testów
  DELETE FROM "Tests" WHERE "courseId" = ref_id;
  
  -- Usuwanie elementów kursu
  DELETE FROM "CourseElements" WHERE "courseId" = ref_id;
  
  -- Usuwanie zapisów na kurs
  DELETE FROM "Enrollments" WHERE "courseId" = ref_id;
  
  -- Usuwanie kolejności elementów kursu
  DELETE FROM "CourseElementOrder" WHERE "courseId" = ref_id;
  
  -- Usuwanie powiązań z kategoriami
  DELETE FROM "_CategoryToCourses" WHERE "B" = ref_id;
  
  -- Na końcu usuwanie samego kursu
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

-- Trigger function do logowania tworzenia kursów
CREATE OR REPLACE FUNCTION log_course_create() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "CourseAuditLog"(course_id, action_type, details) 
  VALUES (
    NEW.id, 
    'CREATE', 
    jsonb_build_object(
      'title', NEW.title, 
      'creator_id', NEW."creatorId"
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function do logowania aktualizacji kursów
CREATE OR REPLACE FUNCTION log_course_update() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "CourseAuditLog"(course_id, action_type, details) 
  VALUES (
    NEW.id, 
    'UPDATE', 
    jsonb_build_object(
      'old_title', OLD.title,
      'new_title', NEW.title, 
      'old_status', OLD.status,
      'new_status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function do logowania usuwania kursów
CREATE OR REPLACE FUNCTION log_course_delete() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "CourseAuditLog"(course_id, action_type, details) 
  VALUES (
    OLD.id, 
    'DELETE', 
    jsonb_build_object(
      'title', OLD.title, 
      'creator_id', OLD."creatorId"
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Tworzenie triggerów
CREATE TRIGGER trg_log_course_create
AFTER INSERT ON "Courses"
FOR EACH ROW EXECUTE PROCEDURE log_course_create();

CREATE TRIGGER trg_log_course_update
AFTER UPDATE ON "Courses"
FOR EACH ROW EXECUTE PROCEDURE log_course_update();

CREATE TRIGGER trg_log_course_delete
BEFORE DELETE ON "Courses"
FOR EACH ROW EXECUTE PROCEDURE log_course_delete();

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

-- Komunikat o poprawnym załadowaniu wyzwalaczy i procedur
DO $$
BEGIN
  RAISE NOTICE 'Wyzwalacze i procedury zostały poprawnie załadowane do bazy danych.';
END $$;
