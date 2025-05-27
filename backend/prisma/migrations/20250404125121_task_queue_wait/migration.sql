-- AlterTable
ALTER TABLE "task_queue" ADD COLUMN     "esperar_ate" TIMESTAMP(3),
ADD COLUMN     "n_retry" INTEGER NOT NULL DEFAULT 0;
