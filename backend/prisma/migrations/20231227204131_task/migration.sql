-- CreateEnum
CREATE TYPE "task_type" AS ENUM ('echo', 'refresh_mv');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'running', 'completed', 'errored');

-- CreateTable
CREATE TABLE "task_queue" (
    "id" SERIAL NOT NULL,
    "type" "task_type" NOT NULL,
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "params" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "pessoa_id" INTEGER,
    "criado_em" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iniciou_em" TIMESTAMP(6),
    "terminou_em" TIMESTAMP(6),
    "removido_em" TIMESTAMP(6),
    "trabalhou_em" TIMESTAMP(6),
    "erro_em" TIMESTAMP(6),
    "erro_messagem" TEXT,

    CONSTRAINT "task_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_queue_status_idx" ON "task_queue"("status");

-- AddForeignKey
ALTER TABLE "task_queue" ADD CONSTRAINT "task_queue_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
