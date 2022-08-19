#!/usr/bin/env perl
use strict;
use warnings;
use utf8;

use FindBin qw($Bin);
use lib "$Bin/../lib";
use Shypper::SchemaConnected;
use Shypper::Daemon::ProcessQueue;

use Shypper::TrapSignals;

my $schema = GET_SCHEMA( );

my $daemon = Shypper::Daemon::ProcessQueue->new( schema => $schema );

while (1) {
    eval { $daemon->listen_queue; };
    if ($@) {
        print STDERR time . " - fatal error on $0: $@";
        ON_TERM_EXIT;
        EXIT_IF_ASKED;
        sleep 5;
    }
}

