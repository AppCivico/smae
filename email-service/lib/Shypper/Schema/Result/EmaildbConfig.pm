use utf8;
package Shypper::Schema::Result::EmaildbConfig;

# Created by DBIx::Class::Schema::Loader
# DO NOT MODIFY THE FIRST PART OF THIS FILE

=head1 NAME

Shypper::Schema::Result::EmaildbConfig

=cut

use strict;
use warnings;

use base 'DBIx::Class::Core';

=head1 COMPONENTS LOADED

=over 4

=item * L<DBIx::Class::InflateColumn::DateTime>

=back

=cut

__PACKAGE__->load_components("InflateColumn::DateTime");

=head1 TABLE: C<emaildb_config>

=cut

__PACKAGE__->table("emaildb_config");

=head1 ACCESSORS

=head2 id

  data_type: 'integer'
  is_auto_increment: 1
  is_nullable: 0
  sequence: 'emaildb_config_id_seq'

=head2 from

  data_type: 'text'
  is_nullable: 0
  original: {data_type => "varchar"}

=head2 template_resolver_class

  data_type: 'varchar'
  is_nullable: 0
  size: 60

=head2 template_resolver_config

  data_type: 'json'
  default_value: '{}'
  is_nullable: 0

=head2 email_transporter_class

  data_type: 'varchar'
  is_nullable: 0
  size: 60

=head2 email_transporter_config

  data_type: 'json'
  default_value: '{}'
  is_nullable: 0

=head2 delete_after

  data_type: 'interval'
  default_value: '7 days'
  is_nullable: 0

=cut

__PACKAGE__->add_columns(
  "id",
  {
    data_type         => "integer",
    is_auto_increment => 1,
    is_nullable       => 0,
    sequence          => "emaildb_config_id_seq",
  },
  "from",
  {
    data_type   => "text",
    is_nullable => 0,
    original    => { data_type => "varchar" },
  },
  "template_resolver_class",
  { data_type => "varchar", is_nullable => 0, size => 60 },
  "template_resolver_config",
  { data_type => "json", default_value => "{}", is_nullable => 0 },
  "email_transporter_class",
  { data_type => "varchar", is_nullable => 0, size => 60 },
  "email_transporter_config",
  { data_type => "json", default_value => "{}", is_nullable => 0 },
  "delete_after",
  { data_type => "interval", default_value => "7 days", is_nullable => 0 },
);

=head1 PRIMARY KEY

=over 4

=item * L</id>

=back

=cut

__PACKAGE__->set_primary_key("id");

=head1 RELATIONS

=head2 emaildb_queues

Type: has_many

Related object: L<Shypper::Schema::Result::EmaildbQueue>

=cut

__PACKAGE__->has_many(
  "emaildb_queues",
  "Shypper::Schema::Result::EmaildbQueue",
  { "foreign.config_id" => "self.id" },
  { cascade_copy => 0, cascade_delete => 0 },
);


# Created by DBIx::Class::Schema::Loader v0.07047 @ 2017-06-29 15:57:37
# DO NOT MODIFY THIS OR ANYTHING ABOVE! md5sum:JsbyMKflrqllTTLA8Q0RFQ

use Moo;
use Shypper::TemplateResolvers::HTTP;

use Email::Simple;

use Class::Load qw/load_class/;
use JSON qw/decode_json/;

has 'template_resolver' => ( is => 'rw', lazy => 1, builder => '_build_template_resolver' );

sub _build_template_resolver {
    my ($self) = @_;

    my $class = $self->template_resolver_class;
    my $cnf   = decode_json( $self->template_resolver_config );

    die 'template_resolver_config must be a hash ref' unless ref $cnf eq 'HASH';

    load_class($class);

    return $class->new( %{$cnf} );

}


has 'email_transporter' => ( is => 'rw', lazy => 1, builder => '_build_email_transporter' );

sub _build_email_transporter {
    my ($self) = @_;

    my $class = $self->email_transporter_class;
    my $cnf   = decode_json( $self->email_transporter_config );

    die 'email_transporter_config must be a hash ref' unless ref $cnf eq 'HASH';

    load_class($class);

    return $class->new( %{$cnf} );

}

sub get_template {
    my ( $self, $template_name ) = @_;

    return $self->template_resolver->get_template($template_name);
}

# You can replace this text with custom code or comments, and it will be preserved on regeneration
1;
