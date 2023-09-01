
CREATE OR REPLACE FUNCTION public.email_config_changed_notify ()
    RETURNS TRIGGER
    AS $BODY$
BEGIN
    NOTIFY newconfig;
    RETURN NULL;
END;
$BODY$
LANGUAGE plpgsql
VOLATILE
COST 100;

CREATE TRIGGER tgr_email_config_changed
    AFTER INSERT OR UPDATE OR DELETE ON public.emaildb_config
    FOR EACH STATEMENT
    EXECUTE PROCEDURE public.email_config_changed_notify ();

