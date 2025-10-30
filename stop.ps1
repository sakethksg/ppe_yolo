#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Stop script for PPE Detection Docker application

.DESCRIPTION
    This script stops the PPE Detection application Docker containers.

.PARAMETER RemoveVolumes
    Remove volumes along with containers

.PARAMETER RemoveImages
    Remove images along with containers

.EXAMPLE
    .\stop.ps1
    Stop all services

.EXAMPLE
    .\stop.ps1 -RemoveVolumes
    Stop services and remove volumes

.EXAMPLE
    .\stop.ps1 -RemoveVolumes -RemoveImages
    Stop services and remove volumes and images
#>

param(
    [Parameter()]
    [switch]$RemoveVolumes,
    
    [Parameter()]
    [switch]$RemoveImages
)

# Set error action preference
$ErrorActionPreference = "Continue"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success {
    Write-ColorOutput Green @args
}

function Write-Info {
    Write-ColorOutput Cyan @args
}

# Print banner
Write-Host ""
Write-Info "=============================================="
Write-Info "   PPE Detection - Stopping Services"
Write-Info "=============================================="
Write-Host ""

# Build docker-compose down command
$downArgs = @('down')

if ($RemoveVolumes) {
    $downArgs += '-v'
    Write-Info "Will remove volumes..."
}

if ($RemoveImages) {
    $downArgs += '--rmi', 'all'
    Write-Info "Will remove images..."
}

# Stop all possible compose configurations
Write-Info "Stopping services..."

# Stop production
docker-compose $downArgs

# Stop development
docker-compose -f docker-compose.dev.yml $downArgs

# Stop production with PostgreSQL
docker-compose -f docker-compose.prod.yml $downArgs

Write-Success "✓ All services stopped"

# Optionally clean up system
if ($RemoveVolumes -and $RemoveImages) {
    $cleanup = Read-Host "Would you like to clean up unused Docker resources? (y/N)"
    if ($cleanup -eq "y" -or $cleanup -eq "Y") {
        Write-Info "Cleaning up Docker system..."
        docker system prune -f
        Write-Success "✓ Cleanup complete"
    }
}

Write-Host ""
Write-Success "=============================================="
Write-Success "   Services Stopped Successfully!"
Write-Success "=============================================="
Write-Host ""

if (-not $RemoveVolumes) {
    Write-Info "Data volumes preserved. Use -RemoveVolumes to remove them."
}
if (-not $RemoveImages) {
    Write-Info "Docker images preserved. Use -RemoveImages to remove them."
}

Write-Host ""
