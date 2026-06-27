-- DropForeignKey
ALTER TABLE "AcademyProgress" DROP CONSTRAINT "AcademyProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuizAttempt" DROP CONSTRAINT "QuizAttempt_userId_fkey";

-- DropTable
DROP TABLE "AcademyProgress";

-- DropTable
DROP TABLE "QuizAttempt";

