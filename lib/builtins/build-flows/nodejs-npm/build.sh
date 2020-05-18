#!/bin/bash
#
# Shell script for ask-cli code build for nodejs-npm flow.
#
# Script Usage: build.sh <OUT_FILE> <DO_DEBUG>
# OUT_FILE is the file name for the output (required)
# DO_DEBUG is boolean value for debug logging
#
# Run this script whenever a package.json is defined

readonly OUT_FILE=${1:-"upload.zip"}
readonly DO_DEBUG=${2:-false}

main() {
  if [[ $DO_DEBUG = true ]]; then
    echo "###########################"
    echo "####### Build Code ########"
    echo "###########################"
  fi

  if ! install_dependencies; then
    display_stderr "Failed to install the dependencies in the project."
    exit 1
  else
    if ! zip_node_modules; then
      display_stderr "Failed to zip the artifacts to ${OUT_FILE}."
      exit 1
    else
      if [[ $DO_DEBUG = true ]]; then
        echo "###########################"
        echo "Codebase built successfully"
        echo "###########################"
      fi
      exit 0
    fi
  fi
}

display_stderr() {
  echo "[Error] $1" >&2
}

display_debug() {
  echo "[Debug] $1" >&2
}

install_dependencies() {
  [[ $DO_DEBUG == true ]] && display_debug "Installing NodeJS dependencies based on the package.json." 
  [[ $DO_DEBUG == false ]] && QQ=true # decide if quiet flag will be appended

  npm install --production ${QQ:+--quiet}
  return $?
}

zip_node_modules() {
  if [[ $DO_DEBUG = true ]]; then
    display_debug "Zipping source files and dependencies to $OUT_FILE."
    zip -vr "$OUT_FILE" ./*
  else
    zip -qr "$OUT_FILE" ./*
  fi
  return $?
}

# Execute main function
main "$@"
