use strict;
use DBIx::Class::Schema::Loader qw/ make_schema_at /;
make_schema_at(
    'SMAE',
    {
        debug          => 1,
        dump_directory => './schema',
    },
    [
        'dbi:Pg:dbname="smae_dev"', 'postgres', 'trust',
    ],
);

