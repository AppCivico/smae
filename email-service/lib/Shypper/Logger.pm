package Shypper::Logger;
use strict;

use Log::Log4perl qw(:easy);

Log::Log4perl->easy_init(
    {
        level  => $DEBUG,
        layout => '%p{1}%d{yyyy-MM-dd HH:mm:ss.SSS}[%P] %m{indent=1}%n',
        'utf8' => 1
    }
);

our @ISA = qw(Exporter);

our @EXPORT = qw(log_info log_fatal log_error get_logger);

my $logger = get_logger;

# logs
sub log_info {
    my (@texts) = @_;
    $logger->info( join ' ', @texts );
}

sub log_error {
    my (@texts) = @_;
    $logger->error( join ' ', @texts );
}

sub log_fatal {
    my (@texts) = @_;
    $logger->fatal( join ' ', @texts );
}

1;
