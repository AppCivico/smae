use strict;
use lib './schema';
use SQL::Translator;

use SMAE;
my $schema = SMAE->connect;

my $translator = SQL::Translator->new(
    parser        => 'SQL::Translator::Parser::DBIx::Class',
    parser_args   => {dbic_schema => $schema},
    producer      => 'Diagram',
    producer_args => {
        out_file    => 'schema.png',
        output_type => 'png',
        title       => 'Modelo',

        skip_tables_like => ['^_', '^emaildb'],
        gutter           => 90,
        num_columns      => 5,
        add_color        => 1,
        font_size        => 'large',
    },
) or die SQL::Translator->error;

$translator->translate;

