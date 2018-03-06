#!/usr/bin/env bash
# Author: l3l_aze@yahoo.com
# Based on https://www.koszek.com/blog/2016/07/25/dealing-with-large-jobs-on-travis/
#
# Usage:
#   travis_fold.sh start FOLDNAME
#   ...do something else
#   travis_fold.sh end
#

tfold() {
  local action=$1
  local name=$2
  echo -en "travis_fold:${action}:${name}\r"
}

TMP=/tmp/.travis_folding

if [ "$1" = 'start' ]; then
  tfold start $2
  echo $2
  /bin/echo -n $2 > $TMP
elif [ "$1" = 'end' ]; then
  tfold end `cat ${TMP}`
fi
