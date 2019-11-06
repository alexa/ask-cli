#!/bin/bash
#
# Shell script for ask-cli code build for java-mvn flow.
#
# Script Usage: build.sh <OUT_FILE> <DO_DEBUG>
# OUT_FILE is the file name for the output (required)
# DO_DEBUG is boolean value for debug logging
#
# Run this script whenever a pom.xml is defined

readonly OUT_FILE=${1:-"upload.zip"}
readonly DO_DEBUG=${2:-false}

main() {
  if [[ $DO_DEBUG = true ]]; then
    echo "###########################"
    echo "####### Build Code ########"
    echo "###########################"
  fi

  if ! build_skill_dependencies; then
    display_stderr "Failed to build the skill artifacts in the project."
    exit 1
  else
    [[ $DO_DEBUG == true ]] && display_debug "Dependencies built successfully."
    if ! rename_to_out_file; then
      display_stderr "Failed to rename the jar file to ${OUT_FILE}."
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

build_skill_dependencies() {
  [[ $DO_DEBUG == true ]] && display_debug "Building skill artifacts based on the pom.xml." 
  [[ $DO_DEBUG == false ]] && QQ=true # decide if quiet flag will be appended

  mvn clean org.apache.maven.plugins:maven-assembly-plugin:2.6:assembly -DdescriptorId=jar-with-dependencies package ${QQ:+--quiet}
  return $?
}

rename_to_out_file() {
  [[ $DO_DEBUG == true ]] && display_debug "Renaming the jar file (target/*jar-with-dependencies.jar) to $OUT_FILE." 
  mv ./target/*jar-with-dependencies.jar $OUT_FILE
  return $?
}

# Execute main function
main "$@"
