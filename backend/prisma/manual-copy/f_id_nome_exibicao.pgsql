CREATE OR REPLACE FUNCTION public.f_id_nome_exibicao (id_pessoa integer) RETURNS json LANGUAGE sql STABLE AS $function$
SELECT
    json_build_object('id', id, 'nome_exibicao', nome_exibicao)
FROM
    pessoa
WHERE
    id = id_pessoa;
$function$;

