-- now() que os testes e2e podem congelar (ver test/variavel/variavel.suspensa-cron.e2e-spec.ts)
CREATE OR REPLACE FUNCTION replaceable_now() RETURNS timestamp with time zone AS $$
    SELECT now()
$$ LANGUAGE sql STABLE;
