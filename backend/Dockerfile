# basedo em https://github.com/IcaliaLabs/docker-wkhtmltopdf/blob/master/alpine3-7.Dockerfile
FROM alpine:3.7 as builder

# 1: Set the wkhtmltopdf version into an environment variable:
ENV WKHTMLTOX_VERSION=0.12.5

# 1: Install development & compiler packages using the alpine package manager:
RUN apk add --no-cache \
 g++ \
 git \
 gtk+3.0 \
 gtk+3.0-dev \
 make \
 mesa-dev \
 openssl-dev \
 patch \
 fontconfig-dev \
 freetype-dev

# 2: Copy the patches:
COPY build/wkpdf-patches/* /tmp/patches/

# 3: Fetch the wkhtmltopdf code, including the qt submodule; checkout the
# required wkhtmltopdf version tag, and apply the patches & edits:
RUN git clone --recursive https://github.com/wkhtmltopdf/wkhtmltopdf.git /tmp/wkhtmltopdf \
 && cd /tmp/wkhtmltopdf \
 && git checkout $WKHTMLTOX_VERSION \
 && cd qt \
 # Apply the patches:
 && patch -p1 -i /tmp/patches/qt-musl.patch \
 && patch -p1 -i /tmp/patches/qt-musl-iconv-no-bom.patch \
 && patch -p1 -i /tmp/patches/qt-recursive-global-mutex.patch \
 && patch -p1 -i /tmp/patches/qt-gcc6.patch \
 # Modify qmake config:
 && sed -i "s|-O2|$CXXFLAGS|" mkspecs/common/g++.conf \
 && sed -i "/^QMAKE_RPATH/s| -Wl,-rpath,||g" mkspecs/common/g++.conf \
 && sed -i "/^QMAKE_LFLAGS\s/s|+=|+= $LDFLAGS|g" mkspecs/common/g++.conf

# 4: Build & Install qt:
RUN cd /tmp/wkhtmltopdf/qt \
 && export NB_CORES=$(grep -c '^processor' /proc/cpuinfo) \
 && ./configure -confirm-license -opensource \
  -prefix /usr \
  -datadir /usr/share/qt \
  -sysconfdir /etc \
  -plugindir /usr/lib/qt/plugins \
  -importdir /usr/lib/qt/imports \
  -silent \
  -release \
  -static \
  -webkit \
  -script \
  -svg \
  -exceptions \
  -xmlpatterns \
  -openssl-linked \
  -no-fast \
  -no-largefile \
  -no-accessibility \
  -no-stl \
  -no-sql-ibase \
  -no-sql-mysql \
  -no-sql-odbc \
  -no-sql-psql \
  -no-sql-sqlite \
  -no-sql-sqlite2 \
  -no-qt3support \
  -no-opengl \
  -no-openvg \
  -no-system-proxies \
  -no-multimedia \
  -no-audio-backend \
  -no-phonon \
  -no-phonon-backend \
  -no-javascript-jit \
  -no-scripttools \
  -no-declarative \
  -no-declarative-debug \
  -no-mmx \
  -no-3dnow \
  -no-sse \
  -no-sse2 \
  -no-sse3 \
  -no-ssse3 \
  -no-sse4.1 \
  -no-sse4.2 \
  -no-avx \
  -no-neon \
  -no-rpath \
  -no-nis \
  -no-cups \
  -no-pch \
  -no-dbus \
  -no-separate-debug-info \
  -no-gtkstyle \
  -no-nas-sound \
  -no-opengl \
  -no-openvg \
  -no-sm \
  -no-xshape \
  -no-xvideo \
  -no-xsync \
  -no-xinerama \
  -no-xcursor \
  -no-xfixes \
  -no-xrandr \
  -no-mitshm \
  -no-xinput \
  -no-xkb \
  -no-glib \
  -no-icu \
  -nomake demos \
  -nomake docs \
  -nomake examples \
  -nomake tools \
  -nomake tests \
  -nomake translations \
  -graphicssystem raster \
  -qt-zlib \
  -qt-libpng \
  -qt-libmng \
  -qt-libtiff \
  -qt-libjpeg \
  -optimized-qmake \
  -iconv \
  -xrender \
  -fontconfig \
  -D ENABLE_VIDEO=0 \
 && make --jobs $(($NB_CORES*2)) --silent \
 && make install

# 5: Build and install wkhtmltopdf
RUN cd /tmp/wkhtmltopdf \
 && export NB_CORES=$(grep -c '^processor' /proc/cpuinfo) \
 && qmake \
 && make --jobs $(($NB_CORES*2)) --silent \
 && make install \
 && make clean \
 && make distclean


FROM node:18-bullseye as SMAE_API

# Instala o graphviz (dot) para gerar EAP do tarefas do lado do server-side
RUN apk add --no-cache graphviz

# Instala as deps do wkhtmltopdf (html para PDF), que é um pouco mais simples que o WeasyPrint,
# muito mais leve do que usar o html-pdf-chrome ou Puppeteer
# pro nosso caso, ta otimo, nosso html é gerado por nos mesmos, então é safe
# porem, é um pouco mais chato de instalar (veja acima, o tanto de coisa pra compilar ele)
RUN apk add --no-cache \
 mesa-dev \
 openssl-dev \
 fontconfig-dev \
 freetype-dev

# 1: Copy the wkhtmltopdf executable:
COPY --from=builder /bin/wkhtmltopdf /bin/wkhtmltopdf

WORKDIR /usr/src/app

RUN npm --loglevel=error install -g npm@9.2.0

COPY --chown=1000:1000 package.json ./
COPY --chown=1000:1000 package-lock.json ./

RUN npm ci

COPY prisma/schema.prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN npm run build

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

CMD ["sh", "./run-api.sh"]