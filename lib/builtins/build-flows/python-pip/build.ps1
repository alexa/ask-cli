# Powershell script for ask-cli code build for python-pip flow.
# Script Usage: build.ps1 <OUT_FILE> <DO_DEBUG>
 
# OUT_FILE is the file name for the output (required)
# DO_DEBUG is boolean value for debug logging

# Run this script whenever a requirements.txt is found

param( 
    [string] $OUT_FILE,
    [bool] $DO_DEBUG = $False
)

function create_venv() {
    if ($DO_DEBUG) {
        Write-Host "Checking for Python3 installation"
    }

    $python_version = python -V | Select-String -Pattern "Python 3." 2>&1 | Out-Null
    if ($python_version) {
        if ($DO_DEBUG) {
            Write-Host "Python3 installation found on system"
            Write-Host "Using Python3's venv script to create virtualenv"
        }
        $python_venv = python -m venv venv 2>&1 | Out-Null
        if ($python_venv) {
            return $true
        } else {
            if ($DO_DEBUG) {
                Write-Host "There was a problem creating virtualenv using venv script"
                Write-Host "Fallback to use virtualenv library"
            }
        }
    } else {
        if ($DO_DEBUG) {
            Write-Host "Python3 installation not found on system. Using Python2"
        }
        return create_using_virtualenv $DO_DEBUG
    }
}
 
function create_using_virtualenv() {
    if ($DO_DEBUG) {
        Write-Host "Cheking for virtualenv library"
    }
    $virtualenv_exist = python -m pip --disable-pip-version-check install virtualenv 2>&1
    if ($virtualenv_exist) {
        if ($DO_DEBUG) {
            Write-Host "Using virtualenv library to create virtualenv"
        }
        $virtualenv_create = python -m virtualenv venv 2>&1
        if ($virtualenv_create) {
            return $true
        } else {
            if ($DO_DEBUG) {
                Write-Host "There was a problem creating virtualenv"
            }
        } 
    } else {
        if ($DO_DEBUG) {
            Write-Host "There was a problem installing virtualenv library"
        }
    }
    return $false
}

function install_dependencies() {
    # Install dependencies from requirements.txt into build folder
    $CMD = "./venv/bin/pip --disable-pip-version-check install -r requirements.txt -t ./"
    Invoke-Expression $CMD 2>&1 | Out-Null
    if ($?) {
        if ($DO_DEBUG) {
            Write-Host "Dependencies installed successfully"
        }
        return $true
    } else {
        if ($DO_DEBUG) {
            Write-Host "There was a problem installing dependencies"
        }
        return $false
    }
}

if ($DO_DEBUG) {
    $LINE_HEADER = "###########################"
    Write-Host $LINE_HEADER
    Write-Host "####### Build Code ########"
    Write-Host $LINE_HEADER
}



if ((create_venv) -and (install_dependencies)) {
    $files = Get-ChildItem -Path .\ -Exclude venv
    Compress-Archive -Path $files -DestinationPath $OUT_FILE
    if ($DO_DEBUG) {
        Write-Host $LINE_HEADER
        Write-Host "###### Build Success ######"
        Write-Host $LINE_HEADER
    }
    exit 0
} else {
    if ($DO_DEBUG) {
        Write-Host $LINE_HEADER
        Write-Host "###### Build Failure ######"
        Write-Host $LINE_HEADER
    }
    exit 1
}
