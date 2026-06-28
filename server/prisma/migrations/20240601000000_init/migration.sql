-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "handle" TEXT,
    "contact" TEXT NOT NULL,
    "build" TEXT NOT NULL,
    "why" TEXT,
    "domains" TEXT[],
    "source" TEXT DEFAULT 'request-board',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Brief_createdAt_idx" ON "Brief"("createdAt");
