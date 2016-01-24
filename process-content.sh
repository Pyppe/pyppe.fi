#!/bin/bash

readonly PROGNAME=$(basename $0)
readonly PROGDIR=$(readlink -m $(dirname $0))
readonly ARGS="$@"
GIVEN_TARGET_DIR="$1"

function processImage() {
  file=$1
  filename=$(basename $file)
  extension="${filename##*.}"
  filename="${filename%.*}"
  targetDir=$(readlink -m $(dirname $file))
  targetDir=$(echo $targetDir | sed "s#$PROGDIR/content/#$PROGDIR/data/#")
  echo "Processing $file"
  cp $file $targetDir/${filename}.$extension > /dev/null 2>&1
  convert -resize "300x180^" -gravity Center -crop 300x180+0+0 +repage $file $targetDir/${filename}.crop.$extension
  convert -resize "500x400>"                                           $file $targetDir/${filename}.aside.$extension
  convert -resize "800x600>" -type Grayscale -auto-gamma               $file $targetDir/${filename}.listing.$extension
  convert -resize "1200x800>"                                          $file $targetDir/${filename}.large.$extension
}

cd $PROGDIR

if [ -d "$GIVEN_TARGET_DIR" ]; then
  GIVEN_TARGET_DIR=$(readlink -m $GIVEN_TARGET_DIR)
  if [[ "$GIVEN_TARGET_DIR" == "$PROGDIR/content"* ]]; then
    for image in $(find $GIVEN_TARGET_DIR -type f -name "*.jpg" -o -name "*.png" -o -name "*.gif"); do
      processImage $image;
    done
  else
    echo "$GIVEN_TARGET_DIR is not valid content-dir"
    exit 1
  fi
else
  TARGET="data"
  rm -rf $TARGET
  cp -ra content $TARGET
  for image in $(find $TARGET -type f -name "*.jpg" -o -name "*.png" -o -name "*.gif"); do
    processImage $image
  done
fi
