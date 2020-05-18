#!/bin/bash
#
# Shell script for ask-cli code build for python-pip flow.
#
# Script Usage: build.sh <OUT_FILE> <DO_DEBUG>
# OUT_FILE is the file name for the output (required)
# DO_DEBUG is boolean value for debug logging
#
# Run this script whenever a requirements.txt is found

readonly OUT_FILE=${1:-"upload.zip"}
readonly DO_DEBUG=${2:-false}


main() {
  if [[ $DO_DEBUG == true ]]; then
    echo "###########################"
    echo "####### Build Code ########"
    echo "###########################"
  fi

  if ! create_using_python3_venv; then
    display_stderr "Failed to create python virtual environment using venv."
    exit 1
  fi
  [[ $DO_DEBUG == true ]] && display_debug "Virtual environment set up successfully"

  if ! install_dependencies; then
    display_stderr "Failed to install the dependencies in the project."
    exit 1
  else
    [[ $DO_DEBUG == true ]] && display_debug "Pip install dependencies successfully."
    if ! zip_site_packages; then
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

#######################################
# For the version of python which contains venv, create virtual environment using the venv script.
# Arguments:
#   None
# Returns:
#   None
#######################################
create_using_python3_venv() {
  [[ $DO_DEBUG == true ]] && display_debug "Creating virtualenv using python3 venv."
  python3 -m venv venv
  return $?
}

install_dependencies() {
  [[ $DO_DEBUG == true ]] && display_debug "Installing python dependencies based on the requirements.txt." 
  [[ $DO_DEBUG == false ]] && QQ=true # decide if quiet flag will be appended

  venv/bin/python -m pip --disable-pip-version-check install -r requirements.txt -t ./ ${QQ:+-qq}
  return $?
}

zip_site_packages() {
  if [[ $DO_DEBUG = true ]]; then
    display_debug "Zipping source files and dependencies to $OUT_FILE."
    zip -vr "$OUT_FILE" ./* -x venv/\*
  else
    zip -qr "$OUT_FILE" ./* -x venv/\*
  fi
  return $?
}

# Execute main function
main "$@"
