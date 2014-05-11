#!/bin/bash

VER="v1.1.1"
declare -a arr=(ace mode-javascript mode-html)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

for file in ${arr[@]}; do
  curl "https://raw.github.com/ajaxorg/ace-builds/$VER/src-noconflict/${file}.js" > "$DIR/${file}.js"
  curl "https://raw.github.com/ajaxorg/ace-builds/$VER/src-min-noconflict/${file}.js" > "$DIR/${file}.min.js"
done

# ace.ui
VER_UI_ACE="v0.1.0"
curl "https://raw.github.com/angular-ui/ui-ace/$VER_UI_ACE/ui-ace.js" > "$DIR/ui-ace.js"
curl "https://raw.github.com/angular-ui/ui-ace/$VER_UI_ACE/ui-ace.min.js" > "$DIR/ui-ace.min.js"

