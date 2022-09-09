use strict;
use utf8;
use Mojo::UserAgent;
use Text::CSV qw( csv );
use JSON;

my $enpdoint = $ENV{URL}    || die 'missing URL';
my $apikey   = $ENV{APIKEY} || die 'missing APIKEY';

my $ua = Mojo::UserAgent->new;

my $fonte_aoh = csv(
    in      => "fonte.tsv",
    headers => "auto",
    binary  => 1,
    sep     => "\t",
);

my $current_fonte
  = [$ua->get($enpdoint . '/fonte-recurso' => {authorization => "Bearer $apikey"})->result->json->{linhas}->@*];

my $by_desc = {};
$by_desc->{$_->{fonte}} = $_ for $current_fonte->@*;

foreach my $fonte_recurso (@{$fonte_aoh}) {
    use DDP;
    p $fonte_recurso;
    if (!$by_desc->{$fonte_recurso->{txtDescricaoFonteRecurso}}) {
        print "criando fonte-recurso " . to_json($fonte_recurso) . "\n";
        my $data = {
            fonte => $fonte_recurso->{txtDescricaoFonteRecurso},
        };

        my $res = $ua->post(
            $enpdoint . '/fonte-recurso' => {authorization => "Bearer $apikey"},
            json                         => $data,
        )->result->json;
        use DDP;
        p $res;
        die to_json($res) if exists $res->{statusCode};
    }
}
