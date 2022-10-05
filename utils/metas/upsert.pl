use strict;
use utf8;
use Mojo::UserAgent;
use Mojo::Util qw/trim/;

use Text::CSV qw( csv );
use JSON;
use open qw/:std :utf8/;

my $enpdoint = $ENV{URL}    || die 'missing URL';
my $apikey   = $ENV{APIKEY} || die 'missing APIKEY';
my $pdm_id   = $ENV{PDM_ID} || die 'missing PDM_ID';

my $ua = Mojo::UserAgent->new;

my ($temas_ids)      = &upsert_temas('tema.utf8.csv', 'tema');
my ($macrotemas_ids) = &upsert_temas('macro_tema.utf8.csv', 'macrotema');
my ($ods_ids)        = &upsert_ods('ods.utf8.csv');

exit;


sub upsert_ods {
    my $fn = shift;

    my $current_ods = [
        $ua->get(
            $enpdoint . "/ods" => {authorization => "Bearer $apikey"},
        )->result->json->{linhas}->@*
    ];

    my $exists_by_number = {};
    $exists_by_number->{$_->{numero}} = $_ for @$current_ods;
    use DDP;
    p $exists_by_number;

    my $aoh = csv(
        in      => $fn,
        headers => "auto",
        binary  => 1,
        sep     => ';',
    );
    my $backref = {};
    foreach my $csv (@$aoh) {
        use DDP;
        p $csv;
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
            my $id = $ua->post(
                $enpdoint . "/$ed" => {authorization => "Bearer $apikey"},
                json               => {
                    pdm_id    => $pdm_id,
                    descricao => $csv->{descricao}
                }
            )->result->json->{id};

            $backref->{$csv->{id}} = $exists_by_name->{$csv->{descricao}}{id} = $id;
        }
    }

    return ($backref);
}
