package Shypper::ConfigBridge;
use Moo;
use strict;
use utf8;
use Shypper;

has 'schema' => ( is => 'rw', );
has 'logger' => ( is => 'rw', );
my $configs;

sub prewarm_configs {
    my ($self) = @_;

    return if $configs;

    $self->logger->info("Prewarming configs...");
    foreach my $cf ( $self->schema->resultset('EmaildbConfig')->all ) {
        $configs->{ $cf->id } = $cf;

        # just load template_resolver() on before forking..
        $cf->template_resolver();
        $cf->email_transporter();
    }

    return 1;
}

sub get_config {
    my ( $self, $id ) = @_;

    return $configs->{$id} if $configs->{$id};

    $self->logger->info("Loading config $id...");

    $configs->{$id} = $self->schema->resultset('EmaildbConfig')->find($id)
      || $self->logger->logcroak("Fatal error: Cannot find EmaildbConfig id=$id");

    $configs->{$id}->template_resolver();
    $configs->{$id}->email_transporter();

    return $configs->{$id};
}

1;
