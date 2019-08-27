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

  local PYTHON="$(decide_python_cmd)"
  if [[ -z $PYTHON ]]; then
    display_stderr "Failed to build the codebase because python runtime is not found. Please open https://www.python.org/downloads/ and install it first."
    exit 1
  fi
  [[ $DO_DEBUG == true ]] && display_debug "Python command found as $PYTHON"

  if [[ $PYTHON != 'python3' ]]; then
    if ! create_using_virtualenv $PYTHON; then
      display_stderr "Failed to create python virtual environment using virtualenv."
      exit 1
    fi
  else
    if ! create_using_python3_venv; then
      [[ $DO_DEBUG == true ]] && display_debug "Failed to create python venv."
      if ! create_using_virtualenv $PYTHON; then
        display_stderr "Failed to create python virtual environment using either venv or virtualenv."
        exit 1
      fi
    fi
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
# Check if python3 or python is in usage. Start the check from python3.
# Arguments:
#   None
# Returns:
#   Python command
#######################################
decide_python_cmd() {
  if command -v python3 $> /dev/null; then
    echo "python3"
  else
    if command -v python $> /dev/null; then
      echo "python"
    else
      echo ""
    fi
  fi
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

#######################################
# For python which doesn't have venv, create virtual environment by "pip install virtualenv" and running virtualenv.
# Arguments:
#   Python command
# Returns:
#   None
#######################################
create_using_virtualenv() {
  [[ $DO_DEBUG == true ]] && display_debug "Creating virtualenv using virtualenv." 
  [[ $DO_DEBUG == false ]] && QQ=true # decide if quiet flag will be appended

  $1 -m pip --disable-pip-version-check install virtualenv ${QQ:+-qq}
  if [[ $? -ne 0 ]]; then
    return 1
  else
    $1 -m virtualenv venv ${QQ:+-q}
    return $?
  fi
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
    zip -vr $OUT_FILE ./* -x venv/\*
  else
    zip -qr $OUT_FILE ./* -x venv/\*
  fi
  return $?
}

# Execute main function
main "$@"
