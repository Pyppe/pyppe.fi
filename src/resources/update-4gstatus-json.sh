#!/usr/bin/env bash

readonly PROGDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $PROGDIR

scp hippu.matrix:/home/pyppe/speedtest.log speedtest.log
sed 's/$/,/' speedtest.log | sed -e '$s/,$/]/' > 4gstatus.json
echo '[' | cat - 4gstatus.json > temp && mv temp 4gstatus.json
