#requires -version 3
<#
    .SYNOPSIS
        PowerShell script for ask-cli's Python-pip code building flow.
    .DESCRIPTION
        This is the PowerShell version of the build script, for building the AWS Lambda deployable skill code that is written in Python language. This script is only run by the ask-cli whenever a 'requirements.txt' file is found alongside the skill code. The dependencies are installed using 'pip', and are packaged using 'zip'.
    .EXAMPLE
        build.ps1 archive.zip
        This example showcases how to run the build script, to create an AWS Lambda deployable package called 'archive.zip'.
    .EXAMPLE
        build.ps1 archive.zip $true
        This example showcases how to run the previous example, with additional debug information.
#>
#----------------[ Parameters ]----------------------------------------------------
param(
    [Parameter(Mandatory = $false,
               ValueFromPipelineByPropertyName = $true,
               HelpMessage = "Name for the AWS Lambda deployable archive")]
        [ValidateNotNullOrEmpty()]
        [string]
        $script:OutFile = "upload.zip",

        # Provide additional debug information during script run
        [Parameter(Mandatory = $false,
                   ValueFromPipelineByPropertyName = $true,
                   HelpMessage = "Enable verbose output")]
        [bool]
        $script:Verbose = $false
)

#----------------[ Declarations ]----------------------------------------------------
$ErrorActionPreference = "Stop"

#----------------[ Functions ]----------------------------------------------------
function Show-Log() {
    <#
        .SYNOPSIS
            Function to log information/error messages to output
        .EXAMPLE
            Show-Log "Test"
                This will log the message as an Information, only if the script is run in Verbose mode

            Show-Log "Test" "Error"
                This will log the message as an Error and STOP the script execution
    #>
    [CmdletBinding()]
    param(
        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [string]
        $Message,

        [Parameter()]
        [ValidateNotNullOrEmpty()]
        [ValidateSet('Info','Error')]
        [string]
        $Severity = 'Info'
    )

    begin {}
    process {
        if ($Severity -eq 'Info') {
            if ($Verbose) {
                Write-Host $Message
            }
        } else {
            Write-Error $Message
        }
    }
    end {}
}

function New-Py3Venv() {
    <#
        .SYNOPSIS
            Function to create virtual environment using Python3 'venv' module.
    #>
    [CmdletBinding()]
    [OutputType()]
    param()

    begin {
        Show-Log "Creating virtualenv using python3 venv."
    }
    process {
        $PythonVersion = & python -V 2>&1
        if($PythonVersion -match "2\.\d\.\d+") {
            Show-Log "Current python ($PythonVersion) is not supported. Please make sure you are using python3, or use your custom script to build the code." "Error"
        }
        Invoke-Expression -Command "python -m venv venv"
        if(!($LASTEXITCODE -eq 0)) {
            Show-Log "Failed to create python virtual environment using venv." "Error"
        }
    }
    end {}
}

function Install-Dependencies() {
    <#
        .SYNOPSIS
            Function to install dependencies in requirements.txt from PyPI, in the current folder.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    begin {
        Show-Log "Installing skill dependencies based on the requirements.txt."
    }
    process {
        $DepCmd = "venv/Scripts/pip3 --disable-pip-version-check install -r requirements.txt -t ./"
        if (-not $Verbose) {
            $DepCmd += " -qq"
        }
        Invoke-Expression -Command $DepCmd
        if(!($LASTEXITCODE -eq 0)) {
            Show-Log "Failed to install the dependencies in the project" "Error"
        }
        return $true
    }
    end {}
}

function Compress-Dependencies() {
    <#
        .SYNOPSIS
            Function to compress source code and dependencies for lambda deployment.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    begin {
        Show-Log "Zipping source files and dependencies to $OutFile."
    }
    process {
        $Files = Get-ChildItem -Path .\ -Exclude venv
        Compress-Archive -Path $Files -DestinationPath "$OutFile"
        return $?
    }
    end {}

}

#----------------[ Main Execution ]----------------------------------------------------

Show-Log "###########################"
Show-Log "####### Build Code ########"
Show-Log "###########################"

New-Py3Venv
Show-Log "Virtual environment set up successfully."

if (Install-Dependencies) {
    Show-Log "Pip install dependencies successfully."
}

if (-Not (Compress-Dependencies)) {
    Show-Log "Failed to zip the artifacts to $OutFile" "Error"
}

Show-Log "###########################"
Show-Log "Codebase built successfully"
Show-Log "###########################"

exit 0
