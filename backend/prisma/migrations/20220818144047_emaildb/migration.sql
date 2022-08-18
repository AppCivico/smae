CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "emaildb_config" (
    "id" serial NOT NULL,
    "from" varchar NOT NULL,
    "template_resolver_class" varchar(60) NOT NULL,
    "template_resolver_config" json NOT NULL DEFAULT '{}',
    "email_transporter_class" varchar(60) NOT NULL,
    "email_transporter_config" json NOT NULL DEFAULT '{}',
    "delete_after" interval NOT NULL DEFAULT '10 year' ::interval,
    CONSTRAINT "emaildb_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emaildb_queue" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4 (),
    "config_id" integer NOT NULL,
    "created_at" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "template" varchar NOT NULL,
    "to" varchar NOT NULL,
    "subject" varchar NOT NULL,
    "variables" json NOT NULL,
    "sent" boolean,
    "updated_at" timestamp(6),
    "visible_after" timestamp(6),
    "errmsg" varchar,
    CONSTRAINT "emaildb_queue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "emaildb_queue"
    ADD CONSTRAINT "emaildb_queue_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "emaildb_config" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE OR REPLACE FUNCTION public.email_inserted_notify ()
    RETURNS TRIGGER
    AS $BODY$
BEGIN
    NOTIFY newemail;
    RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql
VOLATILE
COST 100;

ALTER FUNCTION public.email_inserted_notify () OWNER TO postgres;

CREATE TRIGGER tgr_email_inserted
    AFTER INSERT ON public.emaildb_queue
    FOR EACH STATEMENT
    EXECUTE PROCEDURE public.email_inserted_notify ();

