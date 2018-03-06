#!/usr/bin/env bash

stage=$1

# Partially based on https://stackoverflow.com/a/394247/7665043

if [[ "$stage" == 'script' ]]; then
  unamestr=`uname`
  if [[ "$unamestr" == 'Linux' ]]; then
    ls -la /home/travis/build/l3laze/node-steam-config/node_modules/steam-dummy/data/Linux
    chmod -R u+rwx /home/travis/build/l3laze/node-steam-config/
  else
    echo "OS: $unamestr"
  fi
elif [[ "$stage" == 'after' ]]; then
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/skins
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/steam/appcache
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/steam/config
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/steam/steamapps
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/steam/userdata/107311984/config
  ls -la /home/travis/build/l3laze/node-steam-config/test/Dummy/steam/userdata/107311984/7/remote
  chmod -R ugo+rwx /Users/travis/build/l3laze/node-steam-config/.nyc_output
fi
