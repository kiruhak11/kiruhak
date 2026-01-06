-- AlterTable
ALTER TABLE "ui_components" ADD COLUMN "authorId" TEXT,
ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'approved',
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ui_component_views" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ui_component_views_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ui_components" ADD CONSTRAINT "ui_components_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_component_views" ADD CONSTRAINT "ui_component_views_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "ui_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui_component_views" ADD CONSTRAINT "ui_component_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

