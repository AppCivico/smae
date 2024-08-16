#!/usr/bin/perl
use strict;
use warnings;

my $file = 'schema.prisma';
open my $fh, '<', $file or die "Cannot open file: $!";

my %models;
my $current_model = '';

while (my $line = <$fh>) {
    chomp $line;

    # Capture model name
    if ($line =~ /^model\s+(\w+)\s+{$/) {
        $current_model = $1;
        $models{$current_model} = [];
    }

    # Capture columns with @db.Date()
    if ($line =~ /^\s*(\w+).*\@db\.Date\(\)/) {
        push @{$models{$current_model}}, $1 if $current_model;
    }
}

close $fh;
# Print results
foreach my $model (sort keys %models) {
    if (@{$models{$model}}) {
        print "Model: $model\n";
        print "  Columns with \@db.Date():\n";
        foreach my $column (@{$models{$model}}) {
            print "    - $column\n";
        }
        print "\n";
    }
}
