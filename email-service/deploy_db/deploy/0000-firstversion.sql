-- Deploy emaildb:0000-firstversion to pg
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

create table emaildb_config (
    id serial not null PRIMARY key,
    "from" varchar not null,

    template_resolver_class varchar (60) not null,
    template_resolver_config json not null default '{}'::json,

    email_transporter_class varchar (60) not null,
    email_transporter_config json not null default '{}'::json,

    delete_after interval not null default '7 days'
);

create table emaildb_queue (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    config_id int not null references emaildb_config(id),
    created_at timestamp without time zone not null default now(),

    "template" varchar not null,
    "to" varchar not null,
    subject varchar not null,
    variables json not null,

    sent boolean,
    updated_at timestamp without time zone,
    visible_after timestamp without time zone,
    errmsg varchar
);

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


COMMIT;
