-- CreateTable
CREATE TABLE "Baja" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,

    CONSTRAINT "Baja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Baja_code_key" ON "Baja"("code");
