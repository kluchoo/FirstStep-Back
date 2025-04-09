import { fakerPL as faker } from '@faker-js/faker';
import {
  CourseStatus,
  Difficulty,
  ElementType,
  EnrollmentStatus,
  PrismaClient,
  QuestionType,
  ResultStatus,
  Role,
} from '@prisma/client';
import * as dotenv from 'dotenv';

// Załaduj zmienne środowiskowe
dotenv.config();

const isDevelopment = process.env.DEVELOPMENT === 'true';

const prisma = new PrismaClient();

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
async function seedCategory(name: string, description: string = '') {
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

// Funkcja do seedowania kursu
async function seedCourse(
  creatorId: bigint,
  categoryId: bigint,
  title: string,
  description: string = '',
  difficultyLevel: Difficulty = Difficulty.BASIC,
  status: CourseStatus = CourseStatus.PUBLISHED,
) {
  try {
    return await prisma.courses.create({
      data: {
        creatorId,
        categoryId,
        title,
        description,
        difficultyLevel,
        status,
      },
    });
  } catch (error) {
    console.error(`Błąd podczas tworzenia kursu ${title}:`, error);
    throw error;
  }
}

// Funkcja do seedowania elementów kursu
async function seedCourseElements(courseId: bigint, elementsCount: number = 5) {
  const elementTypes = Object.values(ElementType);

  for (let i = 0; i < elementsCount; i++) {
    const type = faker.helpers.arrayElement(elementTypes);
    await prisma.courseElements.create({
      data: {
        courseId,
        type,
        content: faker.lorem.paragraphs(3),
        order: i + 1,
        additionalData: {},
      },
    });
  }
}

// Funkcja do seedowania testu dla kursu
async function seedTest(
  creatorId: bigint,
  courseId: bigint,
  title: string,
  questionsCount: number = 5,
) {
  // Najpierw tworzymy test
  const test = await prisma.tests.create({
    data: {
      creatorId,
      courseId,
      title,
      duration: faker.number.int({ min: 15, max: 60 }),
    },
  });

  // Następnie tworzymy pytania
  for (let i = 0; i < questionsCount; i++) {
    const questionType = faker.helpers.arrayElement(Object.values(QuestionType));
    const question = await prisma.testQuestions.create({
      data: {
        testId: test.id,
        content: faker.lorem.sentence() + '?',
        questionType,
        points: faker.number.int({ min: 1, max: 5 }),
        order: i + 1,
      },
    });

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

      await prisma.answers.create({
        data: {
          questionId: question.id,
          content:
            questionType === QuestionType.TRUE_FALSE
              ? j === 0
                ? 'Prawda'
                : 'Fałsz'
              : faker.lorem.sentence(),
          isCorrect,
          order: j + 1,
        },
      });
    }
  }

  // Aktualizujemy kurs o powiązanie z testem
  await prisma.courses.update({
    where: { id: courseId },
    data: { testId: test.id },
  });

  return test;
}

async function main() {
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
          const category = faker.helpers.arrayElement(createdCategories);
          const courseTitle = `${faker.word.adjective()} ${category.name} ${faker.number.int(100)}`;

          const course = await seedCourse(
            teacher.id,
            category.id,
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
                progress: faker.number.int({ min: 0, max: 100 }),
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
