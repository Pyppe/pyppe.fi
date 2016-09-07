#!/bin/bash

readonly PROGNAME=$(basename $0)
readonly PROGDIR=$(readlink -m $(dirname $0))
readonly ARGS="$@"
readonly TARGET="$PROGDIR/_site"
readonly JEKYLL=`which jekyll`
readonly ENV_SRC="$PROGDIR/environment.sh"

if [[ ! -f $JEKYLL ]]; then
  echo "Jekyll not found. Exiting..."
  exit 1
fi

if [ ! -f $ENV_SRC ]; then
  echo "$(basename $ENV_SRC) not found. Exiting..."
  exit 1
fi
. $ENV_SRC

cd $PROGDIR

shopt -s globstar

rm -rf $TARGET
if [[ "$*" == *--no-process-content* ]]; then
  echo "WARNING: Not processing content dir"
else
  gulp --env production processContent
fi
if [[ "$*" == *--no-gulp* ]]; then
  echo "WARNING: No gulp pipeline"
else
  gulp --env production
fi
$JEKYLL build
rm -rf $TARGET/content
rm -f $TARGET/*.sh
rm -f $TARGET/*.iml
rm -rf $TARGET/sass
rm -rf $TARGET/node_modules

rsync -hrvz --checksum --stats $TARGET/ $SSH_HOST:$SSH_DIR/
