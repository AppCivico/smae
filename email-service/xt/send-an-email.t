use strict;
use warnings;
use Test::More;
use Test::Fake::HTTPD;
use JSON;

BEGIN { use_ok 'Shypper::SchemaConnected' }
BEGIN { use_ok 'Shypper::Daemon::ProcessQueue' }

my $schema = GET_SCHEMA;
my $daemon = Shypper::Daemon::ProcessQueue->new( schema => $schema );

my $cache_prefix = 'testing-myprefix' . rand . rand;

my $ec = $schema->resultset('EmaildbConfig')->create(
    {
        from                     => '"Testint" <testing@eokoe.com>',
        template_resolver_class  => 'Shypper::TemplateResolvers::HTTP',
        template_resolver_config => encode_json(
            {
                base_url => 'https://family24h.com/_email-templates/dist'
            }
        ),

        email_transporter_config => encode_json(
            {
                host          => 'smtp.sendgrid.net',
                port          => '587',
                sasl_username => $ENV{SENDGRID_USER},
                sasl_password => $ENV{SENDGRID_PASS},
                debug         => 1
            }
        ),
        email_transporter_class => 'Email::Sender::Transport::SMTP::Persistent'
    }
);

is $daemon->run_once, -2, 'no item on queue';
my $rand = 'this is a ' . rand . ' text!';

#         for (1..20){
my $the_email = $schema->resultset('EmaildbQueue')->create(
    {
        to        => $ENV{TO},
        template  => 'default.pt.html',
        subject   => $ENV{SUBJECT},
        config_id => $ec->id,
        variables => encode_json(
            {
                message => 'testando meu email <color> <red>',
                subject => 'this is the subject< or not!',
            }
        )
    }
);

is $daemon->run_once, 1, 'ok';

done_testing();
