# Powershell script for ask-cli code build for nodejs-npm flow.
# Script Usage: build.ps1 <OUT_FILE> <DO_DEBUG>
 
# OUT_FILE is the file name for the output (required)
# DO_DEBUG is boolean value for debug logging

# Run this script whenever a package.json is defined

param( 
    [string] $OUT_FILE,
    [bool] $DO_DEBUG = $False
)

function install_dependencies () {
    Invoke-Expression "npm install" 2>&1 | Out-Null
    $EXEC_RESULT = $?
    return $EXEC_RESULT
}

if ($DO_DEBUG) {
    Write-Output "###########################"
    Write-Output "####### Build Code ########"
    Write-Output "###########################"
}

if (install_dependencies) {
    Compress-Archive -Path ./* -DestinationPath $OUT_FILE
    if ($DO_DEBUG) {
        Write-Output "Codebase built successfully."
    }
} else {
    if ($DO_DEBUG) {
        Write-Output "There was a problem installing the dependencies."
    }
    exit 1
}
if ($DO_DEBUG) {
    Write-Output "###########################"
}

exit 0
