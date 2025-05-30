/*
  Warnings:

  - You are about to drop the `ApiRequestLogControl` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ApiRequestLogControl";

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
