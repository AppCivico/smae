#!/bin/bash -e


export USER=app

source /home/app/perl5/perlbrew/etc/bashrc

cd /tmp/

cpanm -n Furl \
Moo \
Log::Log4perl \
DBIx::Class::InflateColumn::DateTime \
Data::Validate::URI \
Class::Load \
Email::Sender \
Email::MIME::CreateHTML \
Text::Xslate \
Parallel::Prefork \
MIME::Base64 \
Net::SMTP \
Authen::SASL \
JSON \
Test::More \
HTTP::Response \
Test::Fake::HTTPD \
LWP::UserAgent \
URL::Encode \
Test::Pod
