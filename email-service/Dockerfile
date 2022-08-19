FROM phusion/baseimage:focal-1.2.0

# Use baseimage-docker's init system.
CMD ["/sbin/my_init"]

RUN apt-get update && apt-get install -y \
    build-essential \
    libssl-dev \
 && rm -rf /var/lib/apt/lists/* && apt-get clean

RUN useradd -ms /bin/bash app;
USER app

ADD docker/install-perlbrew.sh /tmp/install-perlbrew.sh
RUN /tmp/install-perlbrew.sh

ADD docker/install-cpan-modules.sh /tmp/install-cpan-modules.sh

RUN /tmp/install-cpan-modules.sh

USER root

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libcurl4-openssl-dev zlib1g-dev postgresql-client \
 && rm -rf /var/lib/apt/lists/* && apt-get clean

ADD cpanfile /tmp/cpanfile

ADD docker/install-cpan-extra-modules.sh /tmp/install-cpan-extra-modules.sh
USER app
RUN /tmp/install-cpan-extra-modules.sh
USER root

ENV VARIABLES_JSON_IS_UTF8=1

RUN mkdir /etc/service/app
COPY docker/app.sh /etc/service/app/run

COPY . /src/
