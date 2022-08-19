#!/bin/bash
source /home/app/perl5/perlbrew/etc/bashrc

cd /src;

perl script/process-emails.pl 1>>/data/log/email.log 2>>/data/log/email.error.log
