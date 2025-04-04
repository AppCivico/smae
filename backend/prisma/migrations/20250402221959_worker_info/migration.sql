-- AlterTable
ALTER TABLE "task_queue" ADD COLUMN     "worker_info" JSONB NOT NULL DEFAULT '{}';
