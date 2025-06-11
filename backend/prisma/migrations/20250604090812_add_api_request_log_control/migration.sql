-- CreateEnum
CREATE TYPE "ApiRequestLogControlStatus" AS ENUM ('AWAITING_BACKUP', 'BACKING_UP', 'BACKED_UP', 'RESTORING', 'RESTORED', 'FAILED_BACKUP', 'FAILED_RESTORE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "task_type" ADD VALUE 'backup_api_log_day';
ALTER TYPE "task_type" ADD VALUE 'restore_api_log_day';

-- CreateTable
CREATE TABLE "api_request_log_control" (
    "log_date" DATE NOT NULL,
    "status" "ApiRequestLogControlStatus" NOT NULL,
    "task_id" INTEGER,
    "backup_location" TEXT,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_request_log_control_pkey" PRIMARY KEY ("log_date")
);
