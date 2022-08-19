package Shypper::TrapSignals;
use Shypper::Logger;
use strict;

require Exporter;
use Carp qw/confess/;

our @ISA = qw(Exporter);

our @EXPORT    = qw(ASKED_TO_EXIT EXIT_IF_ASKED ON_TERM_EXIT ON_TERM_WAIT);
our @EXPORT_OK = qw(log_and_exit log_and_wait);

our $BAIL_OUT = 0;

# daemon functions
sub log_and_exit {
    log_info("Graceful exit.");
    exit(0);
}

sub log_and_wait {
    log_info("SIG [TERM|INT] RECV. Waiting job...");
    $BAIL_OUT = 1;
}

# atalhos do daemon
sub ASKED_TO_EXIT {
    $BAIL_OUT;
}

sub EXIT_IF_ASKED {
    &log_and_exit() if $BAIL_OUT;
}

sub ON_TERM_EXIT {
    $SIG{TERM} = \&log_and_exit;
    $SIG{INT}  = \&log_and_exit;
}

sub ON_TERM_WAIT {
    $SIG{TERM} = \&log_and_wait;
    $SIG{INT}  = \&log_and_wait;
}

1;
