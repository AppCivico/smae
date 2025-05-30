-- CreateEnum
CREATE TYPE "ApiRequestLogControlStatus" AS ENUM ('AWAITING_BACKUP', 'BACKING_UP', 'BACKED_UP', 'RESTORING', 'RESTORED', 'FAILED_BACKUP', 'FAILED_RESTORE');

-- CreateTable
CREATE TABLE "ApiRequestLogControl" (
    "log_date" DATE NOT NULL,
    "status" "ApiRequestLogControlStatus" NOT NULL,
    "task_id" INTEGER,
    "backup_location" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiRequestLogControl_pkey" PRIMARY KEY ("log_date")
);
