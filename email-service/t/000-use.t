use strict;
use warnings;
use Test::More;

BEGIN { use_ok 'Shypper::SchemaConnected' }

BEGIN { use_ok 'Shypper::Daemon::ProcessQueue' }

BEGIN { use_ok 'Shypper::ConfigBridge' }


done_testing();
