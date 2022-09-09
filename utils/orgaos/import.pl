use strict;
use utf8;
use Mojo::UserAgent;
use Text::CSV qw( csv );
use JSON;

my $enpdoint = $ENV{URL}    || die 'missing URL';
my $apikey   = $ENV{APIKEY} || die 'missing APIKEY';

my $ua = Mojo::UserAgent->new;

my $tipo_aoh = csv(
    in      => "tipo-orgao.tsv",
    headers => "auto",
    binary  => 1,
    sep     => "\t",
);

my $aoh = csv(
    in      => "orgao.tsv",
    headers => "auto",
    binary  => 1,
    sep     => "\t",
);

my $current_tipo
  = [$ua->get($enpdoint . '/tipo-orgao' => {authorization => "Bearer $apikey"})->result->json->{linhas}->@*];

my $by_desc = {};
$by_desc->{$_->{descricao}} = $_ for $current_tipo->@*;
my $tipo_csv_id2desc = {};
$tipo_csv_id2desc->{$_->{id}} = $_->{descricao} for $tipo_aoh->@*;

use DDP; p $tipo_csv_id2desc;

foreach my $tipo_orgao (@{$tipo_aoh}) {
    if (!$by_desc->{$tipo_orgao->{descricao}}) {
        print "criando tipo-orgão " . to_json($tipo_orgao) . "\n";
        my $data = {
            descricao => $tipo_orgao->{descricao},
        };

        my $res = $ua->post(
            $enpdoint . '/tipo-orgao' => {authorization => "Bearer $apikey"},
            json                      => $data,
        )->result->json;
        use DDP;
        p $res;
        p $tipo_orgao;
        die to_json($res) if exists $res->{statusCode};
        $by_desc->{$tipo_orgao->{descricao}} = {id => $res->{id}};
    }
}

use DDP; p $by_desc;

my $current_orgao
  = [$ua->get($enpdoint . '/orgao' => {authorization => "Bearer $apikey"})->result->json->{linhas}->@*];

my $by_desc_orgao = {};
$by_desc_orgao->{$_->{descricao}} = $_ for $current_orgao->@*;


foreach my $orgao (@{$aoh}) {
    if (!$by_desc_orgao->{$orgao->{descricao}}) {
        print "criando orgão " . to_json($orgao) . "\n";
        my $data = {
            descricao     => $orgao->{descricao},
            sigla         => $orgao->{sigla},
            tipo_orgao_id => $by_desc->{$tipo_csv_id2desc->{$orgao->{tipo_orgao_id}}}{id},
        };

        use DDP;
        p $data;
        my $res = $ua->post(
            $enpdoint . '/orgao' => {authorization => "Bearer $apikey"},
            json                 => $data,
        )->result->json;
        use DDP;
        p $res;
        die to_json($res) if exists $res->{statusCode};


    }
}

 __DATA__
my $csv_by_id = {};
do {
    die to_json($_) . ' código duplicado' if $csv_by_id->{$_->{id}};
    $csv_by_id->{$_->{id}} = $_;
  }
  for $aoh->@*;


use DDP;
p $csv_by_id ;

use DDP;
p $by_desc;
foreach my $tipo_orgao (@{$aoh}) {


    if ($by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}}
        && !$by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}}{shapefile})
    {

        ##$tipo_orgao->{db_id} = $by_desc->{$tipo_orgao->{codigo}}{id};

        print "atualizando shapefile da regiao " . to_json($tipo_orgao) . "\n";

        my $data = {upload_shapefile => $uploads->{$tipo_orgao->{file}}};
        use DDP;
        p $data;

        # regiao ja existe, mas sem upload
        my $res = $ua->patch(
                $enpdoint
              . '/regiao/'
              . $by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}}{id} => {authorization => "Bearer $apikey"},
            json => $data
        )->result->json;
        use DDP;
        p $res;
        die to_json($res) if exists $res->{statusCode};

    }
    elsif (!$by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}}) {

        print "criando regiao " . to_json($tipo_orgao) . "\n";

        # regiao nao existe ainda
        my $data = {
            descricao        => $tipo_orgao->{descricao},
            codigo           => $tipo_orgao->{codigo},
            nivel            => $tipo_orgao->{nivel},
            upload_shapefile => $uploads->{$tipo_orgao->{file}},
        };

        if ($tipo_orgao->{parente_id}) {
            my $parent_cod = $csv_by_id->{$tipo_orgao->{parente_id}}{codigo} || die 'faltando parente' . to_json($tipo_orgao);
            my $parent_nivel = $csv_by_id->{$tipo_orgao->{parente_id}}{nivel} || die 'faltando parente' . to_json($tipo_orgao);
            $data->{parente_id} = $by_desc->{join ',', $parent_nivel, $parent_cod}{id};

            if (!$data->{parente_id}) {
                die 'não encontrou região cod ' . (join ',', $parent_nivel, $parent_cod) . ' no banco';
            }
        }

        use DDP;
        p $data;

        # regiao ja existe, mas sem upload
        my $res = $ua->post(
            $enpdoint . '/regiao' => {authorization => "Bearer $apikey"},
            json                  => $data,
        )->result->json;
        use DDP;
        p $res;
        p $tipo_orgao;
        die to_json($res) if exists $res->{statusCode};
        $by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}} = {id => $res->{id}};
    }
    elsif ($by_desc->{join ',', $tipo_orgao->{nivel}, $tipo_orgao->{codigo}}) {
        print "regiao " . to_json($tipo_orgao) . " registrada\n";

        # TODO? atualizar caso tenha mudanças?
    }

}