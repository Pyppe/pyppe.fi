#!/bin/bash

readonly PROGDIR=$(readlink -m $(dirname $0))

if [ $# -lt 1 ]; then
  echo "Usage: $0 <content-directory>"
  echo "E.g. $0 content/2014/08/my-title"
  exit 1
fi

CONTENT_DIR=$1

if [ ! -d $CONTENT_DIR ]; then
  echo "$CONTENT_DIR does not exist. Exiting..."
  exit 1
fi

for file in $(find $CONTENT_DIR -type f -name "*.jpg" -o -name "*.png" -o -name "*.gif"); do
  echo "Resizing $file ..."
  convert -resize "1920x1920>" $file $file
done