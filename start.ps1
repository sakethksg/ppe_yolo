#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Quick start script for PPE Detection Docker application

.DESCRIPTION
    This script helps you quickly start the PPE Detection application using Docker.
    It checks prerequisites, builds images, and starts the services.

.PARAMETER Mode
    Deployment mode: 'dev' for development or 'prod' for production (default: prod)

.PARAMETER Clean
    Clean rebuild - remove all existing containers and images before building

.EXAMPLE
    .\start.ps1
    Start in production mode

.EXAMPLE
    .\start.ps1 -Mode dev
    Start in development mode

.EXAMPLE
    .\start.ps1 -Clean
    Clean rebuild and start
#>

param(
    [Parameter()]
    [ValidateSet('dev', 'prod')]
    [string]$Mode = 'prod',
    
    [Parameter()]
    [switch]$Clean
)

# Set error action preference
$ErrorActionPreference = "Stop"

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

function Write-Warning {
    Write-ColorOutput Yellow @args
}

function Write-Error {
    Write-ColorOutput Red @args
}

# Print banner
Write-Host ""
Write-Info "=============================================="
Write-Info "   PPE Detection - Docker Quick Start"
Write-Info "=============================================="
Write-Host ""

# Check if Docker is installed
Write-Info "Checking prerequisites..."
try {
    $dockerVersion = docker --version
    Write-Success "✓ Docker installed: $dockerVersion"
} catch {
    Write-Error "✗ Docker is not installed or not in PATH"
    Write-Error "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
}

# Check if Docker Compose is installed
try {
    $composeVersion = docker-compose --version
    Write-Success "✓ Docker Compose installed: $composeVersion"
} catch {
    Write-Error "✗ Docker Compose is not installed"
    Write-Error "Please install Docker Compose"
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Success "✓ Docker daemon is running"
} catch {
    Write-Error "✗ Docker daemon is not running"
    Write-Error "Please start Docker Desktop"
    exit 1
}

# Check if model weights exist
if (-not (Test-Path "mlsrc/weights/best.pt")) {
    Write-Warning "⚠ Model weights not found at mlsrc/weights/best.pt"
    Write-Warning "Please ensure the YOLO model weights are present"
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Clean rebuild if requested
if ($Clean) {
    Write-Info "Cleaning existing containers and images..."
    docker-compose down -v --rmi all 2>$null
    docker-compose -f docker-compose.dev.yml down -v --rmi all 2>$null
    docker-compose -f docker-compose.prod.yml down -v --rmi all 2>$null
    Write-Success "✓ Cleanup complete"
}

# Set compose file based on mode
$composeFile = if ($Mode -eq 'dev') { 'docker-compose.dev.yml' } else { 'docker-compose.yml' }

Write-Host ""
Write-Info "Starting PPE Detection in $Mode mode..."
Write-Host ""

# Build images
Write-Info "Building Docker images..."
docker-compose -f $composeFile build
if ($LASTEXITCODE -ne 0) {
    Write-Error "✗ Build failed"
    exit 1
}
Write-Success "✓ Images built successfully"

# Start services
Write-Info "Starting services..."
docker-compose -f $composeFile up -d
if ($LASTEXITCODE -ne 0) {
    Write-Error "✗ Failed to start services"
    exit 1
}

Write-Success "✓ Services started successfully"

# Wait for services to be healthy
Write-Info "Waiting for services to be ready..."
Start-Sleep -Seconds 10

# Check backend health
$maxRetries = 30
$retryCount = 0
$backendHealthy = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $backendHealthy = $true
            break
        }
    } catch {
        # Service not ready yet
    }
    
    $retryCount++
    Start-Sleep -Seconds 2
    Write-Host "." -NoNewline
}

Write-Host ""

if ($backendHealthy) {
    Write-Success "✓ Backend is healthy"
} else {
    Write-Warning "⚠ Backend health check timed out"
    Write-Warning "Check logs with: docker-compose logs backend"
}

# Check frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "✓ Frontend is accessible"
    }
} catch {
    Write-Warning "⚠ Frontend is not responding yet"
    Write-Warning "It may take a few more seconds to start up"
}

# Display access information
Write-Host ""
Write-Success "=============================================="
Write-Success "   Application Started Successfully!"
Write-Success "=============================================="
Write-Host ""
Write-Info "Access the application at:"
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""

Write-Info "Useful commands:"
Write-Host "  View logs:         docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services:     docker-compose down" -ForegroundColor White
Write-Host "  Restart services:  docker-compose restart" -ForegroundColor White
Write-Host "  View status:       docker-compose ps" -ForegroundColor White
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "Would you like to view the logs now? (y/N)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    docker-compose -f $composeFile logs -f
}
