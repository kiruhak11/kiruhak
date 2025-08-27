-- CreateTable
CREATE TABLE "public"."tutorial_test_questions" (
    "id" TEXT NOT NULL,
    "tutorialId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutorial_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tutorial_test_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutorial_test_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tutorial_test_questions" ADD CONSTRAINT "tutorial_test_questions_tutorialId_fkey" FOREIGN KEY ("tutorialId") REFERENCES "public"."tutorials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tutorial_test_answers" ADD CONSTRAINT "tutorial_test_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."tutorial_test_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
