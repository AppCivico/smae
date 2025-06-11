-- AlterTable
ALTER TABLE "transferencia" ALTER COLUMN "pct_investimento" SET DEFAULT 0,
ALTER COLUMN "pct_custeio" SET DEFAULT 0;

-- AddForeignKey
ALTER TABLE "api_request_log_control" ADD CONSTRAINT "api_request_log_control_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
