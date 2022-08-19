package Shypper::SchemaConnected;
use strict;
use utf8;

use Shypper::Logger;
require Exporter;

our @ISA = qw(Exporter);

our @EXPORT = qw(GET_SCHEMA);

my $connection;

sub GET_SCHEMA {

    my (%opts) = @_;
    return $connection if $connection;
    log_info "require Shypper::Schema...";
    require Shypper::Schema;

    my $lock = '';
    $lock = "SELECT pg_advisory_lock($opts{pg_advisory_lock});"
      if exists $opts{pg_advisory_lock} && $opts{pg_advisory_lock} =~ /^[0-9]+$/;

    # database
    my $db_host = $ENV{EMAILDB_DB_HOST} || 'localhost';
    my $db_pass = $ENV{EMAILDB_DB_PASS} || 'no-password';
    my $db_port = $ENV{EMAILDB_DB_PORT} || '5432';
    my $db_user = $ENV{EMAILDB_DB_USER} || 'postgres';
    my $db_name = $ENV{EMAILDB_DB_NAME} || 'emaildb_dev';

    return $connection = Shypper::Schema->connect(
        "dbi:Pg:host=$db_host;port=$db_port;dbname=$db_name",
        $db_user, $db_pass,
        {
            "AutoCommit"     => 1,
            "quote_char"     => "\"",
            "name_sep"       => ".",
            "pg_enable_utf8" => 1,
            auto_savepoint   => 1,
            "on_connect_do"  => "SET client_encoding=UTF8; SET timezone = 'UTC'; $lock"
        }
    );

}

1;
