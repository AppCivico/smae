package NotRedis;
use Moo;
use strict;
use warnings;
use Carp 'croak';
use File::stat;

has 'path' => (is => 'rw');

my $read_binary = sub {
    my $filename = shift;

    open my $fh, '<:unix', $filename or croak "Couldn't open $filename: $!";
    if (my $size = -s $fh) {
        my $buf;
        my ($pos, $read) = 0;
        do {
            defined($read = read $fh, ${$buf}, $size - $pos, $pos)
              or croak "Couldn't read $filename: $!";
            $pos += $read;
        } while ($read && $pos < $size);
        return ${$buf};
    }
    else {
        return do { local $/; <$fh> };
    }
};

my $write_binary = sub {
    my $filename = $_[0];
    open my $fh, ">:raw", $filename or croak "Couldn't open $filename: $!";
    print $fh $_[1] or croak "Couldn't write to $filename: $!";
    close $fh       or croak "Couldn't write to $filename: $!";
    return;
};

sub _get_path {
    my ($self, $path) = @_;
    $path =~ s/\///g;
    return join '/', $self->path(), $path;
}

sub get {
    my ($self, $key, $ttl) = @_;

    my $path = $self->_get_path($key);
    return if !-e $path;

    my $sb = stat($path) or return;
    return if time() - $sb->mtime >= $ttl;

    return eval { $read_binary->($path) };

}

sub set {
    my ($self, $key, $data) = @_;
    my $path = $self->_get_path($key);

    $write_binary->($path . '.tmp', $data);

    # not really, but works fine 99.99% if same filesystem
    rename($path . '.tmp', $path) or die "cannot rename $path $!";
}

package Shypper::TemplateResolvers::HTTP;
use Moo;
use utf8;
use strict;
use Shypper;
use Shypper::Logger;
use Furl;
use Digest::MD5 qw/md5_hex/;
use JSON;
use Encode;

has 'logger'        => (is => 'rw', lazy    => 1, builder => \&get_logger);
has 'cache_path'    => (is => 'rw', default => sub {'/tmp/'});
has 'base_url'      => (is => 'rw');
has 'headers'       => (is => 'rw');
has 'cache_prefix'  => (is => 'rw', default => 'shypper-template-');
has 'cache_timeout' => (is => 'rw', default => '60');

has 'furl_opts' => (is => 'rw', default => sub { +{} });

has '_furl'  => (is => 'rw', lazy => 1, builder => '_build_furl');
has '_redis' => (is => 'rw', lazy => 1, builder => '_build_notredis');

sub _build_furl {
    Furl->new(
        timeout => 60,
        agent   => 'Emaildb/TemplateResolversHTTP ' . $Shypper::VERSION,
        %{shift->furl_opts()}
    );
}

sub _build_notredis {
    my $self = shift;
    NotRedis->new(path => $self->cache_path,);
}

sub get_template {
    my ($self, $template) = @_;

    my $url = $self->base_url;
    $url .= '/' unless $url =~ /\/$/;
    $url .= $template;

    my $cachekey = $self->cache_prefix() . md5_hex($url);
    my $cached   = $self->_redis->get($cachekey, $self->cache_timeout);

    if ($cached) {
        $cached = decode('UTF-8', $cached);
    }
    else {
        my $headers = $self->headers || [];
        $self->logger->debug("Downloading '$url'");
        my $res = $self->_furl->get($url, $headers);

        $self->logger->logdie(
            'Downloading template failed ' . encode_json({map { $_ => $res->$_ } qw/code decoded_content/}))
          unless $res->is_success;

        $cached = $res->decoded_content;
        $self->_redis->set(
            $cachekey,
            encode('UTF-8', $res->decoded_content)
        );
    }

    return $cached;
}

1;
