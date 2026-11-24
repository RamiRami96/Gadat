-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_expiresAt_idx" ON "Challenge"("expiresAt");
