#!/bin/bash

readonly PROGDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
GULP="$PROGDIR/node_modules/gulp/bin/gulp.js"

echo $GULP

$GULP watch
while [ $? -eq 1 ]; do
  echo "ERRORS... restarting"
  sleep 0.5
  $GULP watch
done
