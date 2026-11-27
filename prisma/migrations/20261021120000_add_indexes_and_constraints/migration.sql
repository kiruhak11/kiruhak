-- Add indexes for the columns that are used in filters and range scans.
--
-- The analytics endpoints aggregate visits by site and time window, the
-- transaction and download lists are filtered by user, and the component
-- views are counted per component. Without these indexes every query is a
-- sequential scan of a table that only grows.

-- CreateIndex
CREATE INDEX "projects_featured_order_idx" ON "projects"("featured", "order");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "sites_userId_idx" ON "sites"("userId");

-- CreateIndex
CREATE INDEX "visits_siteId_timestamp_idx" ON "visits"("siteId", "timestamp");

-- CreateIndex
CREATE INDEX "visits_userId_idx" ON "visits"("userId");

-- CreateIndex
CREATE INDEX "visits_timestamp_idx" ON "visits"("timestamp");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ui_components_authorId_idx" ON "ui_components"("authorId");

-- CreateIndex
CREATE INDEX "ui_components_category_isActive_idx" ON "ui_components"("category", "isActive");

-- CreateIndex
CREATE INDEX "ui_component_views_componentId_viewedAt_idx" ON "ui_component_views"("componentId", "viewedAt");

-- CreateIndex
CREATE INDEX "ui_component_views_userId_idx" ON "ui_component_views"("userId");

-- CreateIndex
CREATE INDEX "tutorials_category_isActive_idx" ON "tutorials"("category", "isActive");

-- CreateIndex
CREATE INDEX "tutorial_steps_tutorialId_idx" ON "tutorial_steps"("tutorialId");

-- CreateIndex
CREATE INDEX "tutorial_progress_userId_idx" ON "tutorial_progress"("userId");

-- CreateIndex
CREATE INDEX "tutorial_test_questions_tutorialId_idx" ON "tutorial_test_questions"("tutorialId");

-- CreateIndex
CREATE INDEX "tutorial_test_answers_questionId_idx" ON "tutorial_test_answers"("questionId");

-- CreateIndex
CREATE INDEX "materials_category_isActive_idx" ON "materials"("category", "isActive");

-- CreateIndex
CREATE INDEX "material_ratings_userId_idx" ON "material_ratings"("userId");

-- CreateIndex
CREATE INDEX "material_downloads_userId_createdAt_idx" ON "material_downloads"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "material_downloads_materialId_idx" ON "material_downloads"("materialId");

-- Give the previously dangling visits.userId column a real foreign key.
-- Rows that point to a deleted user are detached first, otherwise the
-- constraint cannot be created.
UPDATE "visits" SET "userId" = NULL
WHERE "userId" IS NOT NULL AND "userId" NOT IN (SELECT "id" FROM "users");

-- AlterTable
ALTER TABLE "visits" ADD CONSTRAINT "visits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Constrain the enum-like columns to their documented vocabulary.
-- Values outside the allowed set are normalised to a safe default first, so
-- the migration cannot fail on legacy data.

-- Normalise legacy values before adding the constraints.
UPDATE "transactions" SET "type" = 'debit'
WHERE "type" IS NULL OR "type" NOT IN ('credit', 'debit');

UPDATE "ui_components" SET "moderationStatus" = 'pending'
WHERE "moderationStatus" IS NULL OR "moderationStatus" NOT IN ('pending', 'approved', 'rejected');

UPDATE "tutorials" SET "difficulty" = 'beginner'
WHERE "difficulty" IS NULL OR "difficulty" NOT IN ('beginner', 'intermediate', 'advanced');

UPDATE "tutorial_test_questions" SET "type" = 'single'
WHERE "type" IS NULL OR "type" NOT IN ('single', 'multiple', 'text');

UPDATE "materials" SET "type" = 'guide'
WHERE "type" IS NULL OR "type" NOT IN ('checklist', 'template', 'architecture', 'guide');

UPDATE "materials" SET "category" = 'other'
WHERE "category" IS NULL OR "category" NOT IN ('performance', 'security', 'ui', 'deployment', 'other');

UPDATE "projects" SET "ownershipType" = 'UNVERIFIED'
WHERE "ownershipType" IS NULL OR "ownershipType" NOT IN ('OWN', 'CLIENT', 'PARTICIPATION', 'UNVERIFIED');

-- AlterTable
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_type_check" CHECK ("type" IN ('credit', 'debit'));

-- AlterTable
ALTER TABLE "ui_components" ADD CONSTRAINT "ui_components_moderationStatus_check" CHECK ("moderationStatus" IN ('pending', 'approved', 'rejected'));

-- AlterTable
ALTER TABLE "tutorials" ADD CONSTRAINT "tutorials_difficulty_check" CHECK ("difficulty" IN ('beginner', 'intermediate', 'advanced'));

-- AlterTable
ALTER TABLE "tutorial_test_questions" ADD CONSTRAINT "tutorial_test_questions_type_check" CHECK ("type" IN ('single', 'multiple', 'text'));

-- AlterTable
ALTER TABLE "materials" ADD CONSTRAINT "materials_type_check" CHECK ("type" IN ('checklist', 'template', 'architecture', 'guide'));

-- AlterTable
ALTER TABLE "materials" ADD CONSTRAINT "materials_category_check" CHECK ("category" IN ('performance', 'security', 'ui', 'deployment', 'other'));

-- AlterTable
ALTER TABLE "projects" ADD CONSTRAINT "projects_ownershipType_check" CHECK ("ownershipType" IN ('OWN', 'CLIENT', 'PARTICIPATION', 'UNVERIFIED'));

-- AlterTable
ALTER TABLE "material_ratings" ADD CONSTRAINT "material_ratings_rating_check" CHECK ("rating" BETWEEN 1 AND 5);
