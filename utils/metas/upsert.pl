use strict;
use utf8;
use Mojo::UserAgent;
use Mojo::Util qw/trim/;

use Text::CSV qw( csv );
use JSON;
use open qw/:std :utf8/;

my $enpdoint  = $ENV{URL}       || die 'missing URL';
my $apikey    = $ENV{APIKEY}    || die 'missing APIKEY';
my $pdm_id    = $ENV{PDM_ID}    || die 'missing PDM_ID';
my $perfil_cp = $ENV{PERFIL_CP} || die 'missing PERFIL_CP';

my $ua = Mojo::UserAgent->new;

do {
    my ($ods_ids)        = &upsert_ods('ods.utf8.csv');
    my ($temas_ids)      = &upsert_temas('tema.utf8.csv',       'tema');
    my ($macrotemas_ids) = &upsert_temas('macro_tema.utf8.csv', 'macrotema');
    my ($tags_ids)       = &upsert_tags('tag.csv', $ods_ids);
    my ($orgao_ids)      = &lookup_orgao('../orgaos/orgao.tsv');
    &upsert_metas(
        'Meta.csv',
        'Meta_tag.csv',
        'Meta_Orgao.csv',
        $ods_ids,
        $temas_ids,
        $macrotemas_ids,
        $tags_ids,
        $orgao_ids,
    );

};

exit;

sub lookup_orgao {
    my ($tsv) = @_;

    my $aoh = csv(
        in      => $tsv,
        headers => "auto",
        binary  => 1,
        sep     => "\t",
    );

    my $current_orgao
      = [$ua->get($enpdoint . '/orgao' => {authorization => "Bearer $apikey"})->result->json->{linhas}->@*];

    my $by_desc_orgao = {};
    $by_desc_orgao->{$_->{descricao}} = $_ for $current_orgao->@*;

    my $backref = {};
    foreach my $orgao (@{$aoh}) {
        $orgao->{descricao} = trim($orgao->{descricao});

        if (!$by_desc_orgao->{$orgao->{descricao}}) {
            die 'missing orgao ' . $orgao->{descricao};
        }
        else {
            $backref->{$orgao->{id}} = $by_desc_orgao->{$orgao->{descricao}}{id};
        }
    }

    return $backref;
}

sub upsert_metas {
    my ($metasin, $tagsin, $orgaoin, $ods_ids, $temas_ids, $macrotemas_ids, $tags_ids, $orgao_ids) = @_;


    my $current_pessoas = [
        $ua->get(
            $enpdoint . "/pessoa?coorderandor_responsavel_cp=true" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $pessoa_by_orgao = {};
    foreach my $pessoa (@{$current_pessoas}) {
        push @{$pessoa_by_orgao->{$pessoa->{orgao_id}}}, $pessoa->{id};
    }


    my $orgao_aoh = csv(
        in      => $orgaoin,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );

    # monta lista de todos os orgãos que serão necessarios ter membro responsável
    my $orgao_necessarios = {};
    $orgao_necessarios->{$orgao_ids->{$_->{orgao_id}}} = 1 for @{$orgao_aoh};

    foreach my $orgao_id (keys %$orgao_necessarios) {
        next if $pessoa_by_orgao->{$orgao_id};

        my $res = $ua->post(
            $enpdoint . "/pessoa" => {authorization => "Bearer $apikey"},
            json                  => {
                email             => 'tmp.responsavel.' . $orgao_id . '@appcivico.com',
                nome_exibicao     => 'tmp responsavel ' . $orgao_id,
                nome_completo     => 'tmp responsavel ' . $orgao_id,
                lotacao           => 'null',
                cargo             => 'null',
                orgao_id          => $orgao_id,
                perfil_acesso_ids => [$perfil_cp * 1],
            }
        )->result->json;
        my $id = $res->{id} || die 'missing id';
        push @{$pessoa_by_orgao->{$orgao_id}}, $id;
    }

    # ler todas as metas
    my $tags_aoh = csv(
        in      => $tagsin,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );
    my $tags_por_meta = {};

    # filtra apenas as definidas
    $tags_ids->{$_->{tag_id}} && push @{$tags_por_meta->{$_->{meta_id}}}, $tags_ids->{$_->{tag_id}} for @$tags_aoh;

    my $orgao_por_meta = {};
    my $resp_por_meta  = {};
    for my $orgao_csv (@$orgao_aoh) {
        push @{$orgao_por_meta->{$orgao_csv->{meta_id}}}, {
            responsavel   => $orgao_csv->{orgao_responsavel} =~ /false/i ? \0 : \1,
            orgao_id      => $orgao_ids->{$orgao_csv->{orgao_id}},
            participantes => $pessoa_by_orgao->{$orgao_ids->{$orgao_csv->{orgao_id}}}
        };

        $resp_por_meta->{$orgao_csv->{meta_id}} = $pessoa_by_orgao->{$orgao_ids->{$orgao_csv->{orgao_id}}};
    }

    my $metas_aoh = csv(
        in      => $metasin,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );

    my $current_metas = [
        $ua->get(
            $enpdoint . "/meta?pdm_id=$pdm_id" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $meta_por_codigo = {};
    $meta_por_codigo->{$_->{codigo}} = $_ for @$current_metas;
    use DDP;
    p $tags_por_meta;
    foreach my $meta (@{$metas_aoh}) {
        for (keys %$meta) {
            $meta->{$_} = trim($meta->{$_});
            delete $meta->{$_} if ($meta->{$_} eq 'NULL');
        }
        next if $meta_por_codigo->{$meta->{codigo}};

        my $json = {
            pdm_id           => $pdm_id,
            codigo           => $meta->{codigo},
            complemento      => $meta->{complemento} || '',
            contexto         => $meta->{contexto}    || '',
            macro_tema_id    => $meta->{macrotema_id} ? $macrotemas_ids->{$meta->{macrotema_id}} : undef,
            tema_id          => $meta->{tema_id}      ? $temas_ids->{$meta->{tema_id}}           : undef,
            titulo           => $meta->{titulo},
            coordenadores_cp => $resp_por_meta->{$meta->{id}},
            (
                (@{$tags_por_meta->{$meta->{id}} || []} > 0)
                ? (
                    tags => $tags_por_meta->{$meta->{id}},
                  )
                : ()
            ),
            orgaos_participantes => $orgao_por_meta->{$meta->{id}},
        };
        use DDP;
        p $json;
        my $res = $ua->post(
            $enpdoint . "/meta" => {authorization => "Bearer $apikey"},
            json                => $json
        )->result->json;
        use DDP;
        p $res;
        my $id = $res->{id} || die 'missing id';
    }

}

sub upsert_tags {
    my $fn      = shift;
    my $ods_ids = shift;

    my $current_tags = [
        $ua->get(
            $enpdoint . "/tag?pdm_id=$pdm_id" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $exists_by_name = {};
    $exists_by_name->{$_->{descricao}} = $_ for @$current_tags;

    my $aoh = csv(
        in      => $fn,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );

    my $backref = {};
    foreach my $csv (@$aoh) {
        $csv->{descricao} = trim($csv->{descricao});
        $csv->{ods_id}    = trim($csv->{ods_id});

        $csv->{descricao} ||= 'vazio ' . $csv->{id};

        if ($exists_by_name->{$csv->{descricao}}) {
            $backref->{$csv->{id}} = $exists_by_name->{$csv->{descricao}}{id};
        }
        else {
            my $res = $ua->post(
                $enpdoint . "/tag" => {authorization => "Bearer $apikey"},
                json               => {
                    pdm_id    => $pdm_id,
                    ods_id    => $ods_ids->{$csv->{ods_id}},
                    descricao => $csv->{descricao}
                }
            )->result->json;
            use DDP;
            p $res;
            my $id = $res->{id} || die 'missing id';

            $backref->{$csv->{id}} = $exists_by_name->{$csv->{descricao}}{id} = $id;
        }
    }
    use DDP;
    p $backref;

    return ($backref);
}


sub upsert_ods {
    my $fn = shift;

    my $current_ods = [
        $ua->get(
            $enpdoint . "/ods" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $exists_by_number = {};
    $exists_by_number->{$_->{numero}} = $_ for @$current_ods;

    my $aoh = csv(
        in      => $fn,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );
    my $backref = {};
    foreach my $csv (@$aoh) {

#        use DDP;
        #       p $csv;
        $csv->{titulo}    = trim($csv->{titulo});
        $csv->{descricao} = trim($csv->{descricao});
        $csv->{numero}    = trim($csv->{numero});

        if ($exists_by_number->{$csv->{numero}}) {
            $backref->{$csv->{id}} = $exists_by_number->{$csv->{numero}}{id};

            if (   $csv->{titulo} ne $exists_by_number->{$csv->{numero}}{titulo}
                || $csv->{descricao} ne $exists_by_number->{$csv->{numero}}{descricao})
            {
                my $res = $ua->patch(
                    $enpdoint . "/ods/" . $backref->{$csv->{id}} => {authorization => "Bearer $apikey"},
                    json                                         => {
                        titulo    => $csv->{titulo},
                        descricao => $csv->{descricao}
                    }
                )->result->json;
                use DDP;
                p $res;
                my $id = $res->{id} || die 'missing id';
            }
        }
        else {
            my $res = $ua->post(
                $enpdoint . "/ods" => {authorization => "Bearer $apikey"},
                json               => {
                    numero    => $csv->{numero},
                    titulo    => $csv->{titulo},
                    descricao => $csv->{descricao}
                }
            )->result->json;
            use DDP;
            p $res;
            my $id = $res->{id} || die 'missing id';

            $backref->{$csv->{id}} = $exists_by_number->{$csv->{numero}}{id} = $id;
        }
    }
    return ($backref);
}


sub upsert_temas {
    my $fn = shift;
    my $ed = shift;

    my $current_temas = [
        $ua->get(
            $enpdoint . "/$ed?pdm_id=$pdm_id" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $exists_by_name = {};
    $exists_by_name->{$_->{descricao}} = $_ for @$current_temas;

    my $aoh = csv(
        in      => $fn,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );

    my $backref = {};
    foreach my $csv (@$aoh) {
        $csv->{descricao} = trim($csv->{descricao});
        if ($exists_by_name->{$csv->{descricao}}) {
            $backref->{$csv->{id}} = $exists_by_name->{$csv->{descricao}}{id};
        }
        else {
            my $res = $ua->post(
                $enpdoint . "/$ed" => {authorization => "Bearer $apikey"},
                json               => {
                    pdm_id    => $pdm_id,
                    descricao => $csv->{descricao}
                }
            )->result->json;
            use DDP;
            p $res;
            my $id = $res->{id} || die 'missing id';

            $backref->{$csv->{id}} = $exists_by_name->{$csv->{descricao}}{id} = $id;
        }
    }

    return ($backref);
}
