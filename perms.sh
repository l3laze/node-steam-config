#!/usr/bin/env bash

$stage=$1

# Partially based on https://stackoverflow.com/a/394247/7665043

if [[ "$stage" == 'script' ]]; then
  unamestr=`uname`
  if [[ "$unamestr" == 'Linux' ]]; then
    chmod -R u+rwx /home/travis/build/l3laze/node-steam-config/
  else
    echo "OS: $unamestr"
  fi
elif [[ "$stage" == 'after' ]]; then
  chmod -R ugo+rwx /Users/travis/build/l3laze/node-steam-config/.nyc_output
fi
