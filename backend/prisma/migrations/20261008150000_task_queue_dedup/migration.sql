-- CreateTable
CREATE TABLE "task_queue_dedup" (
    "task_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "type" "task_type" NOT NULL,
    "params_hash" CHAR(32) NOT NULL,

    CONSTRAINT "task_queue_dedup_pkey" PRIMARY KEY ("task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_queue_dedup_pessoa_id_type_params_hash_key" ON "task_queue_dedup"("pessoa_id", "type", "params_hash");

-- AddForeignKey
ALTER TABLE "task_queue_dedup" ADD CONSTRAINT "task_queue_dedup_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO task_queue_dedup (task_id, pessoa_id, type, params_hash)
SELECT id, pessoa_id, type, md5(params::text)
FROM task_queue
WHERE status IN ('pending', 'running') AND pessoa_id IS NOT NULL AND removido_em IS NULL
ON CONFLICT DO NOTHING;
