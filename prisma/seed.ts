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

// Załaduj zmienne środowiskowe
dotenv.config();

const IMAGE_PLACEHOLDER = 'http://localhost:3000/uploads/1745770142843-141109177.png';
const isDevelopment = process.env.DEVELOPMENT === 'true';

const prisma = new PrismaClient();

// Funkcja do czyszczenia bazy danych
async function cleanDatabase() {
  console.log('Czyszczenie bazy danych...');

  // Usuwanie danych w odpowiedniej kolejności ze względu na zależności
  await prisma.answers.deleteMany();
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
async function seedCategory(name, description = '') {
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
  categoryIds: bigint[], // dodano parametr categoryIds
  title: string,
  description: string = '',
  difficultyLevel: Difficulty = Difficulty.BASIC,
  status: CourseStatus = CourseStatus.PUBLISHED,
) {
  try {
    // Tworzymy kurs z relacją do wielu kategorii
    const course = await prisma.courses.create({
      data: {
        creatorId,
        title,
        description,
        difficultyLevel,
        status,
        categories: {
          connect: categoryIds.map((id) => ({ id: BigInt(id) })),
        },
        courseOrder: {
          create: {
            lastOrder: 1,
          },
        },
      },
    });

    return course;
  } catch (error) {
    console.error(`Błąd podczas tworzenia kursu ${title}:`, error);
    throw error;
  }
}

// Funkcja do seedowania elementów kursu
async function seedCourseElements(courseId: bigint, elementsCount = 5) {
  // Użyj tylko dostępnych typów z enum
  const elementTypes: ElementType[] = [
    ElementType.HEADER,
    ElementType.TEXT,
    ElementType.IMAGE,
    ElementType.CODE,
  ];

  // Definiujemy stały content dla elementów typu TEXT
  const textElementContent = `[{"insert":"Lorem ","attributes":{"bold":true}},{"insert":"ipsum dolor sit amet, consectetur adipiscing elit. Praesent convallis elementum felis in mollis. Cras pellentesque massa a magna malesuada dignissim. Cras est metus, gravida nec nisi in, venenatis posuere sem. Nullam eleifend sed ante non dapibus. Suspendisse ac neque vel nisi dapibus tempor sed non enim. Donec nulla leo, viverra sit amet nunc egestas, scelerisque lobortis nisl. Sed sodales egestas mauris. Aenean egestas libero at ornare semper. Nam purus nisl, semper id felis eu, bibendum dapibus nunc. Donec scelerisque neque mauris, sit amet eleifend ipsum blandit a. Integer et aliquet sapien. Aliquam ultrices ex ac ex condimentum, vel consequat lectus semper.\\n"}]`;
  try {
    // Pobierz bieżący lastOrder dla tego kursu
    let courseOrder = await prisma.courseElementOrder.findUnique({
      where: { courseId },
    });

    if (!courseOrder) {
      courseOrder = await prisma.courseElementOrder.create({
        data: {
          courseId,
          lastOrder: 1,
        },
      });
    }

    const currentOrder = courseOrder.lastOrder;

    // Tworzymy elementy kursu
    for (let i = 0; i < elementsCount; i++) {
      const type = faker.helpers.arrayElement(elementTypes);
      let content;

      // Wybieramy odpowiednią zawartość w zależności od typu elementu
      if (type === ElementType.TEXT) {
        content = textElementContent;
      } else if (type === ElementType.IMAGE) {
        content = IMAGE_PLACEHOLDER;
      } else if (type === ElementType.HEADER) {
        content = faker.lorem.words(3);
      } else {
        content = faker.lorem.paragraph();
      }

      const element = await prisma.courseElements.create({
        data: {
          courseId,
          type,
          content,
          order: currentOrder + i,
          additionalData: {},
        },
      });
      // Dodajemy styl do elementu kursu
      await prisma.elementsStyle.create({
        data: {
          courseElementId: element.id,
          isBold: faker.datatype.boolean(),
          isItalic: faker.datatype.boolean(),
          isUnderline: faker.datatype.boolean(),
          hasHighlight: faker.datatype.boolean(),
          color: faker.color.rgb({ prefix: '#', casing: 'lower' }),
          fontSize: faker.number.float({ min: 10, max: 32, fractionDigits: 1 }),
        },
      });
    }

    // Aktualizujemy lastOrder w CourseElementOrder
    await prisma.courseElementOrder.update({
      where: { courseId },
      data: { lastOrder: currentOrder + elementsCount },
    });
  } catch (error) {
    console.error(`Błąd podczas tworzenia elementów dla kursu ID: ${courseId}:`, error);
    throw error;
  }
}

// Funkcja do seedowania testu dla kursu
async function seedTest(creatorId: bigint, courseId: bigint, title: string, questionsCount = 5) {
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
  // Najpierw czyścimy bazę danych
  await cleanDatabase();

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
          const courseTitle = `${faker.word.adjective()} ${courseCategories[0].name} ${faker.number.int(100)}`;

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
