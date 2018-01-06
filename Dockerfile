#!/bin/echo docker build . -f
# -*- coding: utf-8 -*-
#{
# Copyright 2018 Samsung Electronics France SAS
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#}

FROM node:8
MAINTAINER Philippe Coval (philippe.coval@osg.samsung.com)

ENV DEBIAN_FRONTEND noninteractive
ENV LC_ALL en_US.UTF-8
ENV LANG ${LC_ALL}

RUN echo "#log: Configuring locales" \
 && set -x \
 && apt-get update \
 && apt-get install -y locales \
 && echo "${LC_ALL} UTF-8" | tee /etc/locale.gen \
 && locale-gen ${LC_ALL} \
 && dpkg-reconfigure locales \
 && sync

ENV project iotivity-node

ARG prefix
ENV prefix ${prefix:-/usr/}
ARG destdir
ENV destdir ${destdir:-/usr/local/opt/${project}}

RUN echo "#log: ${project}: Preparing system" \
 && set -x \
 && apt-get update -y \
 && apt-get install -y \
\
   unzip \
   scons \
   wget \
   git \
   patch \
   tar \
   make \
\
   build-essential \
   devscripts \
   debhelper \
   base-files \
\
   autoconf \
   automake \
   autotools-dev \
   bash \
   git \
   libtool \
   make \
   python-dev \
   scons \
   sudo \
   unzip \
   valgrind \
   wget \
\
   libboost-date-time-dev \
   libboost-iostreams-dev \
   libboost-log-dev \
   libboost-program-options-dev \
   libboost-regex-dev \
   libboost-system-dev \
   libboost-thread-dev \
   libbz2-dev \
   libcurl4-openssl-dev \
   libglib2.0-dev \
   libicu-dev \
   libsqlite3-dev \
   uuid-dev \
  && apt-get clean \
  && sync

RUN echo "#log: ${project}: Preparing environment" \
 && set -x \
 && node --version \
 && npm --version \
 && npm install grunt -g \
 && grunt --version \
 && sync

USER nobody
ADD . /usr/local/src/${project}
WORKDIR /tmp/
RUN echo "#log: ${project}: Get sources" \
 && set -x \
 && cp -rfa /usr/local/src/${project} ${project} \
 && sync

USER nobody
WORKDIR /tmp/${project}
RUN echo "#log: ${project}: Building" \
 && set -x \
 && export HOME=${PWD} \
 && export PATH=/usr/local/bin:${PATH} \
 && rm -rf .git/hooks/* \
 && export NODE_ENV=production \
 && npm install || npm --loglevel verbose install \
 && echo TODO: npm test \
 && sync

USER nobody
WORKDIR /tmp/${project}
RUN echo "#log: ${project}: Running" \
 && set -x \
 && export HOME=${PWD} \
 && export PATH=/usr/local/bin:${PATH} \
 && echo "#log: background job" \
 && echo '#!/bin/sh -x -e\n\
node js/server.get.js | tee server.log.tmp & \n\
sleep 4.2 \n\
node js/client.get.js | tee client.log.tmp & \n\
sleep 42 \n\
grep "^Received response to GET request:" client.log.tmp \n\
killall node \n\
' | tee -a run.sh \
 && sh -e -x run.sh \
 && sync
