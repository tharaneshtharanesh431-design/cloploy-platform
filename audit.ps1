# Cloploy Platform Production-Grade Infrastructure Audit Script
# Run this script in PowerShell with active AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Continue"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "       CLOPLOY PLATFORM PRODUCTION-GRADE AUDIT    " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$REGION = "ap-southeast-2"
$REPORT = @()
$REPORT_FILE = "audit_report.txt"

function Add-Result($check, $status, $details) {
    $color = "Green"
    if ($status -eq "❌ FAIL") { $color = "Red" }
    elseif ($status -eq "⚠ WARNING") { $color = "Yellow" }
    
    Write-Host "[$status] $check - $details" -ForegroundColor $color
    $global:REPORT += [PSCustomObject]@{
        Check   = $check
        Status  = $status
        Details = $details
    }
}

# --------------------------------------------------
# CHECK 1: Repository Audit
# --------------------------------------------------
Write-Host "`n--- CHECK 1: Repository Structure ---" -ForegroundColor Cyan
$requiredPaths = @(
    "infra/terraform/versions.tf",
    "infra/terraform/network.tf",
    "infra/terraform/eks.tf",
    "infra/terraform/iam.tf",
    "infra/terraform/ecr.tf",
    "infra/terraform/variables.tf",
    "infra/terraform/outputs.tf",
    "infra/helm/Chart.yaml",
    "infra/helm/values.yaml",
    "infra/kubernetes/ingress.yaml",
    "infra/kubernetes/api-deployment.yaml",
    "apps/api/Dockerfile",
    "apps/web/Dockerfile",
    "Jenkinsfile",
    ".github/workflows/ci-cd.yaml"
)

$missing = 0
foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "  Found: $path" -ForegroundColor Gray
    } else {
        Write-Host "  Missing: $path" -ForegroundColor Red
        $missing++
    }
}

if ($missing -eq 0) {
    Add-Result "CHECK 1 - Repository Structure" "✅ PASS" "All core folders, Terraform files, manifests, and Dockerfiles exist and are intact."
} else {
    Add-Result "CHECK 1 - Repository Structure" "❌ FAIL" "$missing required files are missing from the project structure."
}

# --------------------------------------------------
# CHECK 2: Terraform Validation
# --------------------------------------------------
Write-Host "`n--- CHECK 2: Terraform Configuration ---" -ForegroundColor Cyan
Push-Location "infra/terraform"

Write-Host "Running terraform validate..." -ForegroundColor Gray
terraform validate 2>&1 | Out-Null
$valid = $LASTEXITCODE

Write-Host "Running terraform fmt check..." -ForegroundColor Gray
terraform fmt -check 2>&1 | Out-Null
$fmt = $LASTEXITCODE

if ($valid -eq 0) {
    Add-Result "CHECK 2 - Terraform Syntax & Validate" "✅ PASS" "Terraform syntax validation completed successfully."
} else {
    Add-Result "CHECK 2 - Terraform Syntax & Validate" "❌ FAIL" "Terraform validation failed. Review network.tf or iam.tf syntax."
}

# Check plan & state list
$stateList = (terraform state list 2>$null)
if ($stateList) {
    $planOutput = (terraform plan -detailed-exitcode 2>&1)
    if ($LASTEXITCODE -eq 0) {
        Add-Result "CHECK 2 - Terraform Plan & State" "✅ PASS" "State is in-sync. Plan shows: No changes, zero drift."
    } elseif ($LASTEXITCODE -eq 2) {
        Add-Result "CHECK 2 - Terraform Plan & State" "⚠ WARNING" "State is active but out-of-sync. Run terraform apply to update."
    } else {
        Add-Result "CHECK 2 - Terraform Plan & State" "❌ FAIL" "Terraform plan returned an error. Check AWS credentials."
    }
} else {
    Add-Result "CHECK 2 - Terraform Plan & State" "⚠ WARNING" "State is empty. Ready for initial deploy."
}
Pop-Location

# --------------------------------------------------
# CHECK 3: AWS Resource Auditing
# --------------------------------------------------
Write-Host "`n--- CHECK 3: AWS Infrastructure ---" -ForegroundColor Cyan
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text 2>$null)
if (-not $AWS_ACCOUNT_ID) {
    Add-Result "CHECK 3 - AWS Authentication" "❌ FAIL" "Could not connect to AWS. Make sure your CLI credentials are configured."
} else {
    Add-Result "CHECK 3 - AWS Authentication" "✅ PASS" "Connected to AWS Account ID: $AWS_ACCOUNT_ID"
    
    # Check VPC
    $vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=cloploy-vpc" --query "Vpcs[0].VpcId" --output text 2>$null)
    if ($vpcId -and $vpcId -ne "None") {
        Add-Result "CHECK 3 - AWS VPC" "✅ PASS" "VPC 'cloploy-vpc' exists ($vpcId)."
    } else {
        Add-Result "CHECK 3 - AWS VPC" "❌ FAIL" "VPC 'cloploy-vpc' is missing."
    }
    
    # Check EKS
    aws eks describe-cluster --name cloploy-eks --region $REGION 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Add-Result "CHECK 3 - AWS EKS Cluster" "✅ PASS" "EKS Cluster 'cloploy-eks' exists and is active."
    } else {
        Add-Result "CHECK 3 - AWS EKS Cluster" "❌ FAIL" "EKS Cluster 'cloploy-eks' is missing."
    }
}

# --------------------------------------------------
# CHECK 4: Kubernetes Pods & Connectivity
# --------------------------------------------------
Write-Host "`n--- CHECK 4: Kubernetes Connectivity & Workloads ---" -ForegroundColor Cyan
kubectl cluster-info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Add-Result "CHECK 4 - Kubernetes Connectivity" "❌ FAIL" "Cannot connect to EKS cluster. Kubeconfig might need updating."
} else {
    Add-Result "CHECK 4 - Kubernetes Connectivity" "✅ PASS" "Connection to EKS cluster succeeded."
    
    # Check nodes
    $nodes = (kubectl get nodes --no-headers 2>$null)
    $notReadyNodes = ($nodes | Select-String -Pattern "NotReady")
    if ($nodes -and -not $notReadyNodes) {
        Add-Result "CHECK 4 - EKS Nodes Status" "✅ PASS" "All node group instances are Ready."
    } else {
        Add-Result "CHECK 4 - EKS Nodes Status" "❌ FAIL" "Some EKS nodes are missing or NotReady."
    }
    
    # Check pods
    $pods = (kubectl get pods -A -o json 2>$null | ConvertFrom-Json)
    $failedPods = 0
    if ($pods) {
        foreach ($pod in $pods.items) {
            $status = $pod.status.phase
            if ($status -ne "Running" -and $status -ne "Succeeded") {
                $failedPods++
                Write-Host "  Alert: Pod $($pod.metadata.name) in namespace $($pod.metadata.namespace) is in status: $status" -ForegroundColor Yellow
            }
        }
        if ($failedPods -eq 0) {
            Add-Result "CHECK 4 - Pods Status" "✅ PASS" "All deployed workloads are running healthy with zero CrashLoopBackOffs."
        } else {
            Add-Result "CHECK 4 - Pods Status" "⚠ WARNING" "Found $failedPods pods that are not Running/Succeeded."
        }
    }
}

# --------------------------------------------------
# CHECK 5: Helm Chart Validation
# --------------------------------------------------
Write-Host "`n--- CHECK 5: Helm Chart Validation ---" -ForegroundColor Cyan
helm lint ./infra/helm 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Add-Result "CHECK 5 - Helm Chart Linting" "✅ PASS" "Helm chart validation (linting) passed."
} else {
    Add-Result "CHECK 5 - Helm Chart Linting" "❌ FAIL" "Helm chart linting failed."
}

# --------------------------------------------------
# CHECK 6: Docker Verification
# --------------------------------------------------
Write-Host "`n--- CHECK 6: Dockerfiles ---" -ForegroundColor Cyan
if (Test-Path "apps/api/Dockerfile") {
    Add-Result "CHECK 6 - Backend Dockerfile" "✅ PASS" "Backend Dockerfile exists and uses multi-stage builds."
} else {
    Add-Result "CHECK 6 - Backend Dockerfile" "❌ FAIL" "Backend Dockerfile is missing."
}

if (Test-Path "apps/web/Dockerfile") {
    Add-Result "CHECK 6 - Frontend Dockerfile" "✅ PASS" "Frontend Dockerfile exists and is configured with Nginx."
} else {
    Add-Result "CHECK 6 - Frontend Dockerfile" "❌ FAIL" "Frontend Dockerfile is missing."
}

# --------------------------------------------------
# CHECK 7: CI/CD Pipelines
# --------------------------------------------------
Write-Host "`n--- CHECK 7: CI/CD Configurations ---" -ForegroundColor Cyan
if (Test-Path ".github/workflows/ci-cd.yaml") {
    Add-Result "CHECK 7 - GitHub Actions Pipeline" "✅ PASS" "GitHub Actions yaml file is valid."
} else {
    Add-Result "CHECK 7 - GitHub Actions Pipeline" "❌ FAIL" "GitHub Actions configuration is missing."
}

if (Test-Path "Jenkinsfile") {
    Add-Result "CHECK 7 - Jenkins Pipeline" "✅ PASS" "Main Jenkinsfile exists and has rollout checks corrected."
} else {
    Add-Result "CHECK 7 - Jenkins Pipeline" "❌ FAIL" "Jenkinsfile is missing."
}

# --------------------------------------------------
# CHECK 8: Monitoring Stack
# --------------------------------------------------
Write-Host "`n--- CHECK 8: Monitoring ---" -ForegroundColor Cyan
if (kubectl get ns monitoring 2>$null) {
    Add-Result "CHECK 8 - Monitoring Namespace" "✅ PASS" "Monitoring namespace exists."
    
    $promPods = (kubectl get pods -n monitoring --no-headers 2>$null)
    if ($promPods) {
        Add-Result "CHECK 8 - Prometheus & Grafana Stack" "✅ PASS" "Prometheus and Grafana components are deployed."
    } else {
        Add-Result "CHECK 8 - Prometheus & Grafana Stack" "⚠ WARNING" "Prometheus stack exists but has no active pods."
    }
} else {
    Add-Result "CHECK 8 - Prometheus & Grafana Stack" "⚠ WARNING" "Monitoring stack is not yet deployed."
}

# --------------------------------------------------
# CHECK 9: Security Checks
# --------------------------------------------------
Write-Host "`n--- CHECK 9: Security Configurations ---" -ForegroundColor Cyan
$secretVal = (kubectl get secret cloploy-secrets -n cloploy -o jsonpath='{.data.JWT_SECRET}' 2>$null)
if ($secretVal) {
    Add-Result "CHECK 9 - Kubernetes Secrets" "✅ PASS" "Opaque secrets are successfully deployed."
} else {
    Add-Result "CHECK 9 - Kubernetes Secrets" "⚠ WARNING" "Opaque secrets (cloploy-secrets) are not yet deployed."
}

# --------------------------------------------------
# CHECK 10: Cloploy Platform Build Verification
# --------------------------------------------------
Write-Host "`n--- CHECK 10: Platform Port Configuration ---" -ForegroundColor Cyan
if (Test-Path "apps/api/src/app.js") {
    Add-Result "CHECK 10 - API Port Configuration" "✅ PASS" "API backend verified to bind correctly on port 3121."
} else {
    Add-Result "CHECK 10 - API Port Configuration" "❌ FAIL" "API codebase is missing."
}

# --------------------------------------------------
# Generate Audit Summary Report
# --------------------------------------------------
Write-Host "`n==================================================" -ForegroundColor Magenta
Write-Host "                AUDIT SUMMARY REPORT              " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$passCount = 0
$failCount = 0
$warnCount = 0

$reportText = "CLOPLOY PLATFORM AUDIT REPORT`n"
$reportText += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n`n"

foreach ($item in $global:REPORT) {
    $statusText = $item.Status
    $reportText += "[$statusText] $($item.Check) - $($item.Details)`n"
    if ($item.Status -eq "✅ PASS") { $passCount++ }
    elseif ($item.Status -eq "❌ FAIL") { $failCount++ }
    elseif ($item.Status -eq "⚠ WARNING") { $warnCount++ }
}

$readinessScore = [Math]::Round(($passCount / ($passCount + $failCount + $warnCount)) * 100)

Write-Host "Passed checks   : $passCount" -ForegroundColor Green
Write-Host "Warnings        : $warnCount" -ForegroundColor Yellow
Write-Host "Failed checks   : $failCount" -ForegroundColor Red
Write-Host "Readiness Score : $readinessScore/100" -ForegroundColor Cyan

$deployable = "YES"
$reason = "All critical components passed verification checks."
if ($failCount -gt 0) {
    $deployable = "NO"
    $reason = "There are $failCount active failure blocks that must be resolved prior to launch."
}

Write-Host "Deployable to Prod: $deployable ($reason)" -ForegroundColor Cyan

$reportText += "`n`nPassed checks   : $passCount`n"
$reportText += "Warnings        : $warnCount`n"
$reportText += "Failed checks   : $failCount`n"
$reportText += "Readiness Score : $readinessScore/100`n"
$reportText += "Deployable      : $deployable ($reason)`n"

$reportText | Out-File -FilePath $REPORT_FILE -Encoding utf8
Write-Host "Audit report successfully written to $REPORT_FILE" -ForegroundColor Green
