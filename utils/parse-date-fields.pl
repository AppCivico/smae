#!/usr/bin/perl
use strict;
use warnings;

my $current_model = '';
my @date_fields   = ();

# Read the input file
while (<>) {
    chomp;

    # Check for model declaration
    if (/model\s+(\w+)\s+{/) {
        $current_model = $1;
        next;
    }

    # Look for fields with @db.Date() or @db.Date
    # Handle inline comments and optional parentheses
    if ($current_model && /^\s*(\w+)\s+\w+.*\@db\.Date(?:\(\))?\b/) {
        my $field = $1;

        # Clean up any trailing comments
        $field =~ s/\s*\/\/.*$//;
        push @date_fields, "$field $current_model";
    }
}

# Print results
print "$_\n" for @date_fields;
