#requires -version 3
<#
    .SYNOPSIS
        PowerShell script for ask-cli's Java-mvn code building flow.
    .DESCRIPTION
        This is the PowerShell version of the build script, for building the AWS Lambda deployable skill code that is written in Java language. This script is only run by the ask-cli whenever a 'pom.xml' file is found alongside the skill code. The dependencies are installed and packaged using 'mvn'.
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

function Build-SkillArtifacts() {
    <#
        .SYNOPSIS
            Function to compile the skill project, aggregate the project output along with its dependencies, modules, site documentation, and other files into a single distributable jar
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    begin {
        Show-Log "Building skill artifacts based on pom.xml."
    }
    process {
        $DepCmd = "mvn clean org.apache.maven.plugins:maven-assembly-plugin:2.6:assembly -DdescriptorId=jar-with-dependencies package"
        if (-not $Verbose) {
            $DepCmd += " --quiet"
        }
        Invoke-Expression -Command $DepCmd | Out-String | Tee-Object -Variable 'result'
        if(!($LASTEXITCODE -eq 0)) {
            Show-Log "$result `n Failed to build the skill artifacts in the project." "Error"
        }
        return $true
    }
    end {}
}

function Rename-Archive() {
    <#
        .SYNOPSIS
            Function to rename the build archive into cli format.
    #>
    [CmdletBinding()]
    [OutputType([bool])]
    param()

    begin {
        Show-Log "Renaming build archive to $OutFile."
    }
    process {
        Move-Item -Path ./target/*jar-with-dependencies.jar -Destination $OutFile
        return $?
    }
    end {}

}

#----------------[ Main Execution ]----------------------------------------------------

Show-Log "###########################"
Show-Log "####### Build Code ########"
Show-Log "###########################"

if (Build-SkillArtifacts) {
    Show-Log "Skill artifacts built successfully."
}

if (-Not (Rename-Archive)) {
    Show-Log "Failed to rename build archive to $OutFile" "Error"
}

Show-Log "###########################"
Show-Log "Codebase built successfully"
Show-Log "###########################"

exit 0
