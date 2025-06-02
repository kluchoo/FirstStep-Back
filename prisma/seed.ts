import { fakerPL as faker } from '@faker-js/faker';
import {
  CourseStatus,
  Difficulty,
  ElementType,
  PrismaClient,
  QuestionType,
  ResultStatus,
  Role,
} from '@prisma/client';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Załaduj zmienne środowiskowe
dotenv.config();

const IMAGE_PLACEHOLDER = 'http://localhost:3000/uploads/1745770142843-141109177.png';
const VIDEO_PLACEHOLDER = 'http://localhost:3000/uploads/1745914752310-738194624.mp4';
const isDevelopment = process.env.DEVELOPMENT === 'true';

const prisma = new PrismaClient();
// Dodajemy pool do bezpośrednich zapytań SQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(/^"|"$/g, ''),
});

// Funkcja do czyszczenia bazy danych
async function cleanDatabase() {
  console.log('Czyszczenie bazy danych...');

  // Usuwanie danych w odpowiedniej kolejności ze względu na zależności
  await prisma.testAnswers.deleteMany();
  await prisma.testQuestions.deleteMany();
  await prisma.testResults.deleteMany();
  await prisma.tests.deleteMany();
  await prisma.enrollments.deleteMany();
  await prisma.elementsStyle.deleteMany(); // Najpierw usuwamy style elementów
  await prisma.courseElements.deleteMany();
  await prisma.courseElementOrder.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.categories.deleteMany();
  await prisma.fileUploads.deleteMany(); // Dodajemy usuwanie plików przed użytkownikami
  await prisma.users.deleteMany();

  // Automatyczne resetowanie wszystkich sekwencji autoincrement w PostgreSQL
  const sequences = await prisma.$queryRawUnsafe(
    `SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public';`,
  );
  for (const seq of sequences as Array<{ sequence_name: string }>) {
    try {
      await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
    } catch (e) {
      console.warn(`Nie udało się zresetować sekwencji ${seq.sequence_name}:`, e);
    }
  }

  console.log('Baza danych została wyczyszczona');
}

// Funkcja do seedowania pojedynczego użytkownika
async function seedUser(nickname: string, email: string, role: Role, password: string) {
  try {
    return await prisma.users.upsert({
      where: { email },
      update: {
        nickname,
        role,
      },
      create: {
        nickname,
        email,
        password,
        role,
        lastLoginDate: new Date(),
      },
    });
  } catch (error) {
    console.error(`Błąd podczas tworzenia/aktualizacji użytkownika ${nickname}:`, error);
    throw error;
  }
}

// Funkcja do seedowania kategorii
async function seedCategory(name: string, description = '') {
  try {
    return await prisma.categories.upsert({
      where: { name },
      update: {
        description,
      },
      create: {
        name,
        description,
      },
    });
  } catch (error) {
    console.error(`Błąd podczas tworzenia/aktualizacji kategorii ${name}:`, error);
    throw error;
  }
}

// Funkcja do seedowania kursu - zmodyfikowana, aby używać bezpośrednich zapytań SQL
async function seedCourse(
  creatorId: bigint,
  categoryIds: bigint[], // dodano parametr categoryIds
  title: string,
  description: string = '',
  difficultyLevel: Difficulty = Difficulty.BASIC,
  status: CourseStatus = CourseStatus.PUBLISHED,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Poprawiono nazwę kolumny z "creatorid" na "creatorId" z prawidłową wielkością liter
    const courseResult = await client.query(
      `
      INSERT INTO "Courses" ("creatorId", title, description, "difficultyLevel", status) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *
      `,
      [creatorId.toString(), title, description, difficultyLevel, status],
    );

    const course = courseResult.rows[0];

    // Tworzymy element order dla kursu
    await client.query(
      `
      INSERT INTO "CourseElementOrder" ("courseId", "lastOrder") 
      VALUES ($1, 1)
      `,
      [course.id],
    );

    // Dodajemy powiązania z kategoriami - używamy "_CourseCategories" zgodnie ze schematem Prisma
    for (const categoryId of categoryIds) {
      await client.query(
        `
        INSERT INTO "_CourseCategories" ("A", "B") 
        VALUES ($1, $2)
        `,
        [categoryId.toString(), course.id],
      );
    }

    await client.query('COMMIT');
    return course;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Błąd podczas tworzenia kursu ${title}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Funkcja do seedowania elementów kursu - zmodyfikowana, aby używać bezpośrednich zapytań SQL
async function seedCourseElements(courseId: bigint, elementsCount = 5) {
  // Użyj tylko dostępnych typów z enum
  const elementTypes: ElementType[] = [
    ElementType.HEADER,
    ElementType.TEXT,
    ElementType.IMAGE,
    ElementType.VIDEO,
  ];

  // Definiujemy stały content dla elementów typu TEXT
  const textElementContent = `[{"insert":"Lorem ","attributes":{"bold":true}},{"insert":"ipsum dolor sit amet, consectetur adipiscing elit. Praesent convallis elementum felis in mollis. Cras pellentesque massa a magna malesuada dignissim. Cras est metus, gravida nec nisi in, venenatis posuere sem. Nullam eleifend sed ante non dapibus. Suspendisse ac neque vel nisi dapibus tempor sed non enim. Donec nulla leo, viverra sit amet nunc egestas, scelerisque lobortis nisl. Sed sodales egestas mauris. Aenean egestas libero at ornare semper. Nam purus nisl, semper id felis eu, bibendum dapibus nunc. Donec scelerisque neque mauris, sit amet eleifend ipsum blandit a. Integer et aliquet sapien. Aliquam ultrices ex ac ex condimentum, vel consequat lectus semper.\\n"}]`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Pobierz bieżący lastOrder dla tego kursu
    const courseOrderResult = await client.query(
      `
      SELECT "lastOrder" FROM "CourseElementOrder" 
      WHERE "courseId" = $1
      `,
      [courseId.toString()],
    );

    let currentOrder = 1;
    if (courseOrderResult.rows.length > 0) {
      currentOrder = courseOrderResult.rows[0].lastOrder;
    } else {
      await client.query(
        `
        INSERT INTO "CourseElementOrder" ("courseId", "lastOrder") 
        VALUES ($1, 1)
        `,
        [courseId.toString()],
      );
    }

    // Tworzymy elementy kursu
    for (let i = 0; i < elementsCount; i++) {
      const type = faker.helpers.arrayElement(elementTypes);
      let content;

      // Wybieramy odpowiednią zawartość w zależności od typu elementu
      if (type === ElementType.TEXT) {
        content = textElementContent;
      } else if (type === ElementType.IMAGE) {
        content = IMAGE_PLACEHOLDER;
      } else if (type === ElementType.VIDEO) {
        content = VIDEO_PLACEHOLDER;
      } else if (type === ElementType.HEADER) {
        content = `[{"insert":"Nowy nagłówek\\n"}]`;
      } else {
        content = faker.lorem.paragraph();
      }

      // Tworzymy element kursu
      const elementResult = await client.query(
        `
        INSERT INTO "CourseElements" ("courseId", type, content, "order", "additionalData") 
        VALUES ($1, $2, $3, $4, $5::jsonb) 
        RETURNING *
        `,
        [courseId.toString(), type, content, currentOrder + i, '{}'],
      );

      const element = elementResult.rows[0];

      // Dodajemy styl do elementu kursu
      await client.query(
        `
        INSERT INTO "ElementsStyle" ("courseElementId", "isBold", "isItalic", "isUnderline", "hasHighlight", "color", "fontSize") 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          element.id,
          faker.datatype.boolean(),
          faker.datatype.boolean(),
          faker.datatype.boolean(),
          faker.datatype.boolean(),
          faker.color.rgb({ prefix: '#', casing: 'lower' }),
          faker.number.float({ min: 10, max: 32, fractionDigits: 1 }),
        ],
      );
    }

    // Aktualizujemy lastOrder w CourseElementOrder
    await client.query(
      `
      UPDATE "CourseElementOrder" 
      SET "lastOrder" = $1 
      WHERE "courseId" = $2
      `,
      [currentOrder + elementsCount, courseId.toString()],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Błąd podczas tworzenia elementów dla kursu ID: ${courseId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Funkcja do seedowania testu dla kursu - zmodyfikowana, aby używać bezpośrednich zapytań SQL
async function seedTest(creatorId: bigint, courseId: bigint, title: string, questionsCount = 5) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Najpierw tworzymy test
    const testResult = await client.query(
      `
      INSERT INTO "Tests" ("creatorId", "courseId", title, duration) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
      `,
      [creatorId.toString(), courseId.toString(), title, faker.number.int({ min: 15, max: 60 })],
    );

    const test = testResult.rows[0];

    // Następnie tworzymy pytania
    for (let i = 0; i < questionsCount; i++) {
      const questionType = faker.helpers.arrayElement(Object.values(QuestionType));

      const questionResult = await client.query(
        `
        INSERT INTO "TestQuestions" ("testId", content, "questionType", points, "order") 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
        `,
        [
          test.id,
          faker.lorem.sentence() + '?',
          questionType,
          faker.number.int({ min: 1, max: 5 }),
          i + 1,
        ],
      );

      const question = questionResult.rows[0];

      // Dla każdego pytania tworzymy odpowiedzi
      const answersCount =
        questionType === QuestionType.TRUE_FALSE ? 2 : faker.number.int({ min: 2, max: 5 });

      for (let j = 0; j < answersCount; j++) {
        let isCorrect = false;

        // Dla pytań jednokrotnego wyboru, tylko jedna odpowiedź jest poprawna
        if (questionType === QuestionType.SINGLE_CHOICE && j === 0) {
          isCorrect = true;
        }
        // Dla pytań wielokrotnego wyboru, losowo określamy poprawność
        else if (questionType === QuestionType.MULTIPLE_CHOICE) {
          isCorrect = faker.datatype.boolean();
        }
        // Dla pytań true/false
        else if (questionType === QuestionType.TRUE_FALSE) {
          isCorrect = j === 0;
        }

        await client.query(
          `
          INSERT INTO "TestAnswers" ("questionId", content, "isCorrect", "order") 
          VALUES ($1, $2, $3, $4)
          `,
          [
            question.id,
            questionType === QuestionType.TRUE_FALSE
              ? j === 0
                ? 'Prawda'
                : 'Fałsz'
              : faker.lorem.sentence(),
            isCorrect,
            j + 1,
          ],
        );
      }
    }

    // Aktualizujemy kurs o powiązanie z testem
    await client.query(
      `
      UPDATE "Courses" 
      SET "testId" = $1 
      WHERE id = $2
      `,
      [test.id, courseId.toString()],
    );

    await client.query('COMMIT');
    return test;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Błąd podczas tworzenia testu dla kursu ID: ${courseId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Funkcja main pozostaje podobna, ale używa teraz bezpośrednich zapytań SQL
async function main() {
  // Najpierw czyścimy bazę danych
  await cleanDatabase();

  // Wyłączamy wyzwalacze na czas seedowania - każde polecenie osobno
  console.log('Wyłączanie wyzwalaczy na czas seedowania...');
  try {
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_log_course_create ON "Courses"`;
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_log_course_update ON "Courses"`;
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trg_log_course_delete ON "Courses"`;
    console.log('Wyzwalacze zostały wyłączone');
  } catch (error) {
    console.warn('Nie udało się wyłączyć wyzwalaczy:', error);
  }

  const defaultPassword = '$2b$10$6iP4.aytBwTWlJmHCZWD5eVQy5faxxQtjEsQpk5kcTiBBzJwYyrim'; // zahaszowane "password123"
  console.log('Rozpoczęto seedowanie bazy danych...');

  // Seed użytkowników
  const users = [
    {
      nickname: 'admin',
      email: 'admin@example.com',
      role: Role.ADMIN,
      password: defaultPassword,
    },
    {
      nickname: 'teacher',
      email: 'teacher@example.com',
      role: Role.TEACHER,
      password: defaultPassword,
    },
    {
      nickname: 'student',
      email: 'student@example.com',
      role: Role.STUDENT,
      password: defaultPassword,
    },
  ];

  const createdUsers = [];

  // Dodanie losowych użytkowników w przypadku środowiska deweloperskiego
  if (isDevelopment) {
    const randomUsers = faker.helpers.multiple(
      () => {
        return {
          nickname: faker.internet.userName(),
          email: faker.internet.email(),
          role: faker.helpers.arrayElement([Role.STUDENT, Role.TEACHER]),
          password: defaultPassword,
        };
      },
      { count: 10 },
    );

    users.push(...randomUsers);
  }

  // Seed użytkowników
  for (const userData of users) {
    try {
      const user = await seedUser(
        userData.nickname,
        userData.email,
        userData.role,
        userData.password,
      );
      createdUsers.push(user);
      console.log(`Użytkownik ${user.nickname} (${user.role}) utworzony/zaktualizowany pomyślnie`);
    } catch (error) {
      console.error(`Nie udało się utworzyć/zaktualizować użytkownika ${userData.nickname}`);
    }
  }

  // Seed kategorii
  const categories = [
    { name: 'Programowanie', description: 'Kursy związane z programowaniem' },
    { name: 'Matematyka', description: 'Kursy matematyczne' },
    { name: 'Języki obce', description: 'Kursy językowe' },
    { name: 'Rozwój osobisty', description: 'Kursy z zakresu rozwoju osobistego' },
  ];

  const createdCategories = [];

  for (const categoryData of categories) {
    try {
      const category = await seedCategory(categoryData.name, categoryData.description);
      createdCategories.push(category);
      console.log(`Kategoria ${category.name} utworzona/zaktualizowana pomyślnie`);
    } catch (error) {
      console.error(`Nie udało się utworzyć/zaktualizować kategorii ${categoryData.name}`);
    }
  }

  // W środowisku deweloperskim tworzymy kursy, testy i zapisy
  if (isDevelopment && createdUsers.length > 0 && createdCategories.length > 0) {
    const teachers = createdUsers.filter(
      (user) => user.role === Role.TEACHER || user.role === Role.ADMIN,
    );
    const students = createdUsers.filter((user) => user.role === Role.STUDENT);

    // Dla każdego nauczyciela tworzymy kilka kursów
    for (const teacher of teachers) {
      const coursesCount = faker.number.int({ min: 1, max: 3 });

      for (let i = 0; i < coursesCount; i++) {
        try {
          // Losuj 1-2 kategorie dla kursu
          const courseCategories = faker.helpers.arrayElements(
            createdCategories,
            faker.number.int({ min: 1, max: Math.min(2, createdCategories.length) }),
          );
          if (courseCategories.length === 0) continue;
          const courseTitle = `${faker.word.adjective()} ${courseCategories[0]?.name} ${faker.number.int(100)}`;

          const course = await seedCourse(
            teacher.id,
            courseCategories.map((cat) => cat.id),
            courseTitle,
            faker.lorem.paragraph(),
            faker.helpers.arrayElement(Object.values(Difficulty)),
            faker.helpers.arrayElement(Object.values(CourseStatus)),
          );

          // Dodajemy elementy kursu
          await seedCourseElements(course.id, faker.number.int({ min: 3, max: 10 }));

          // Dodajemy test dla kursu
          const test = await seedTest(
            teacher.id,
            course.id,
            `Test do ${courseTitle}`,
            faker.number.int({ min: 3, max: 8 }),
          );

          console.log(`Kurs "${courseTitle}" wraz z elementami i testem utworzony pomyślnie`);

          // Zapisujemy losowych studentów na kurs
          const enrollStudents = faker.helpers.arrayElements(
            students,
            faker.number.int({ min: 0, max: students.length }),
          );

          for (const student of enrollStudents) {
            await prisma.enrollments.create({
              data: {
                courseId: course.id,
                userId: student.id,
              },
            });

            // Dla niektórych studentów tworzymy wyniki testu
            if (faker.datatype.boolean()) {
              await prisma.testResults.create({
                data: {
                  testId: test.id,
                  userId: student.id,
                  result: faker.number.int({ min: 0, max: 100 }),
                  startDate: faker.date.recent(),
                  endDate: faker.datatype.boolean() ? faker.date.recent() : null,
                  status: faker.helpers.arrayElement(Object.values(ResultStatus)),
                },
              });
            }
          }

          console.log(`${enrollStudents.length} studentów zapisanych na kurs "${courseTitle}"`);
        } catch (error) {
          console.error(`Błąd podczas tworzenia kursu dla nauczyciela ${teacher.nickname}:`, error);
        }
      }
    }
  }

  // Na końcu ponownie włączamy wyzwalacze - każde polecenie osobno
  console.log('Ponowne włączanie wyzwalaczy...');
  try {
    await prisma.$executeRaw`
      CREATE TRIGGER trg_log_course_create
      AFTER INSERT ON "Courses"
      FOR EACH ROW EXECUTE FUNCTION log_course_create()
    `;
    
    await prisma.$executeRaw`
      CREATE TRIGGER trg_log_course_update
      AFTER UPDATE ON "Courses"
      FOR EACH ROW EXECUTE FUNCTION log_course_update()
    `;
    
    await prisma.$executeRaw`
      CREATE TRIGGER trg_log_course_delete
      BEFORE DELETE ON "Courses"
      FOR EACH ROW EXECUTE FUNCTION log_course_delete()
    `;
    
    console.log('Wyzwalacze zostały ponownie włączone');
  } catch (error) {
    console.warn('Nie udało się włączyć wyzwalaczy:', error);
  }
}

main()
  .then(async () => {
    console.log('Seedowanie bazy danych zakończone pomyślnie');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Błąd podczas seedowania:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
