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
    headers => "auto"
);

my $uploads = -e $uploads_file_cache ? slurp_json($uploads_file_cache) : {};

foreach my $regiao (@{$aoh}) {

    my $zip = $regiao->{shapefile};
    $zip =~ s/[^0-9s]//g;
    $zip .= '.zip';
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

use DDP;
p $aoh;

