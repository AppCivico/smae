CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "emaildb_config" (
    "id" SERIAL NOT NULL,
    "from" VARCHAR NOT NULL,
    "template_resolver_class" VARCHAR(60) NOT NULL,
    "template_resolver_config" JSON NOT NULL DEFAULT '{}',
    "email_transporter_class" VARCHAR(60) NOT NULL,
    "email_transporter_config" JSON NOT NULL DEFAULT '{}',
    "delete_after" interval NOT NULL DEFAULT '10 year'::interval,

    CONSTRAINT "emaildb_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emaildb_queue" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "config_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template" VARCHAR NOT NULL,
    "to" VARCHAR NOT NULL,
    "subject" VARCHAR NOT NULL,
    "variables" JSON NOT NULL,
    "sent" BOOLEAN,
    "updated_at" TIMESTAMP(6),
    "visible_after" TIMESTAMP(6),
    "errmsg" VARCHAR,

    CONSTRAINT "emaildb_queue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "emaildb_queue" ADD CONSTRAINT "emaildb_queue_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "emaildb_config"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE OR REPLACE FUNCTION public.email_inserted_notify()
  RETURNS trigger AS
$BODY$
    BEGIN
        NOTIFY newemail;
        RETURN NULL;
    END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION public.email_inserted_notify()
  OWNER TO postgres;

CREATE TRIGGER tgr_email_inserted
  AFTER INSERT
  ON public.emaildb_queue
  FOR EACH STATEMENT
  EXECUTE PROCEDURE public.email_inserted_notify();

