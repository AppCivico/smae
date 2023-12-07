CREATE TABLE "api_request_log" (
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cf_ray" TEXT NOT NULL,
    "request_num" INTEGER NOT NULL,
    "ip" INET NOT NULL,
    "response_time" INTEGER NOT NULL,
    "response_size" INTEGER NOT NULL,
    "req_method" TEXT NOT NULL,
    "req_path" TEXT NOT NULL,
    "req_host" TEXT NOT NULL,
    "req_headers" TEXT,
    "req_query" TEXT,
    "req_body" TEXT,
    "req_body_size" INTEGER,
    "res_code" SMALLINT NOT NULL,
    "created_pessoa_id" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "api_request_log_created_at_cf_ray_request_num_key" ON "api_request_log"("created_at", "cf_ray", "request_num");



