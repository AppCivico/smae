use strict;
use utf8;
use Mojo::UserAgent;
use Text::CSV qw( csv );
use JSON;
use JSON::Slurper qw(slurp_json spurt_json);

my $uploads_file_cache = './uploads.ids.json';

my $enpdoint = $ENV{URL}    || die 'missing URL';
my $apikey   = $ENV{APIKEY} || die 'missing APIKEY';

my $ua = Mojo::UserAgent->new;

my $aoh = csv(
    in      => "crud.csv",
    headers => "auto",
    binary  => 1,
);

$aoh = [sort { $a->{nivel} <=> $b->{nivel} } $aoh->@*];

my $uploads = -e $uploads_file_cache ? slurp_json($uploads_file_cache) : {};

foreach my $regiao (@{$aoh}) {

    my $zip = $regiao->{shapefile};
    $zip =~ s/[^0-9]//g;
    $zip .= '.zip';
    $regiao->{file} = $zip;

    next if $uploads->{$zip};

    my $res = $ua->post(
        $enpdoint . '/upload' => {authorization => "Bearer $apikey"},
        form                  => {
            tipo    => 'SHAPEFILE',
            arquivo => {file => $zip},
        }
    )->result->json;

    $uploads->{$zip} = $res->{upload_token};
    spurt_json($uploads, $uploads_file_cache);
}

my $current_regions = [grep { defined $_->{codigo} }
      $ua->get($enpdoint . '/regiao' => {authorization => "Bearer $apikey"})->result->json->{linhas}->@*];


my $by_codigo = {};
do {
    die to_json($_) . ' código duplicado' if $by_codigo->{join ',', $_->{nivel}, $_->{codigo}};
    $by_codigo->{join ',', $_->{nivel}, $_->{codigo}} = $_;
  }
  for $current_regions->@*;

my $csv_by_id = {};
do {
    die to_json($_) . ' código duplicado' if $csv_by_id->{$_->{id}};
    $csv_by_id->{$_->{id}} = $_;
  }
  for $aoh->@*;


use DDP;
p $csv_by_id ;

use DDP;
p $by_codigo;
foreach my $regiao (@{$aoh}) {


    if ($by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}}
        && !$by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}}{shapefile})
    {

        ##$regiao->{db_id} = $by_codigo->{$regiao->{codigo}}{id};

        print "atualizando shapefile da regiao " . to_json($regiao) . "\n";

        my $data = {upload_shapefile => $uploads->{$regiao->{file}}};
        use DDP;
        p $data;

        # regiao ja existe, mas sem upload
        my $res = $ua->patch(
                $enpdoint
              . '/regiao/'
              . $by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}}{id} => {authorization => "Bearer $apikey"},
            json => $data
        )->result->json;
        use DDP;
        p $res;
        die to_json($res) if exists $res->{statusCode};

    }
    elsif (!$by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}}) {

        print "criando regiao " . to_json($regiao) . "\n";

        # regiao nao existe ainda
        my $data = {
            descricao        => $regiao->{descricao},
            codigo           => $regiao->{codigo},
            nivel            => $regiao->{nivel},
            upload_shapefile => $uploads->{$regiao->{file}},
        };

        if ($regiao->{parente_id}) {
            my $parent_cod = $csv_by_id->{$regiao->{parente_id}}{codigo} || die 'faltando parente' . to_json($regiao);
            my $parent_nivel = $csv_by_id->{$regiao->{parente_id}}{nivel} || die 'faltando parente' . to_json($regiao);
            $data->{parente_id} = $by_codigo->{join ',', $parent_nivel, $parent_cod}{id};

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
        p $regiao;
        die to_json($res) if exists $res->{statusCode};
        $by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}} = {id => $res->{id}};
    }
    elsif ($by_codigo->{join ',', $regiao->{nivel}, $regiao->{codigo}}) {
        print "regiao " . to_json($regiao) . " registrada\n";

        # TODO? atualizar caso tenha mudanças?
    }

}