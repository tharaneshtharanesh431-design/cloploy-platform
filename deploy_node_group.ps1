# Cloploy EKS Managed Node Group Deployment & State Alignment Script
# Run this script in PowerShell with active AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "     CLOPLOY EKS MANAGED NODE GROUP DEPLOYMENT    " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$REGION = "ap-southeast-2"

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
Write-Host "Active AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green

# --------------------------------------------------
# Phase 1: Terraform State Alignment & Imports
# --------------------------------------------------
Write-Host "`n--- PHASE 1: Aligning Existing Resources ---" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfPath = Join-Path $scriptPath "infra/terraform"

Push-Location $tfPath

Write-Host "Initializing Terraform..." -ForegroundColor Yellow
terraform init -reconfigure
if ($LASTEXITCODE -ne 0) { throw "Terraform Init failed!" }

# Get current state list
$stateList = (terraform state list 2>$null)

# Helper function to check and import
function Import-Resource($addr, $awsId) {
    if (-not $awsId -or $awsId -eq "None" -or $awsId -eq "") {
        Write-Host "AWS Resource for $addr does not exist. Will be created fresh." -ForegroundColor Gray
        return
    }
    if ($stateList -contains $addr) {
        Write-Host "Resource '$addr' already exists in state." -ForegroundColor Green
        return
    }
    Write-Host "AWS Resource '$awsId' found. Importing into state as '$addr'..." -ForegroundColor Yellow
    terraform import $addr $awsId
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Import failed for $addr ($awsId)." -ForegroundColor Red
    } else {
        Write-Host "Successfully imported $addr." -ForegroundColor Green
    }
}

# 1. Discover VPC
$vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=cloploy-vpc" --query "Vpcs[0].VpcId" --output text)
if ($vpcId -eq "None" -or -not $vpcId) {
    $vpcId = (aws ec2 describe-vpcs --filters "Name=tag:Project,Values=cloploy" --query "Vpcs[0].VpcId" --output text)
}
Import-Resource "aws_vpc.main" $vpcId

# 2. Discover Subnets
if ($vpcId -and $vpcId -ne "None") {
    $pub1 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-1" --query "Subnets[0].SubnetId" --output text)
    $pub2 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-2" --query "Subnets[0].SubnetId" --output text)
    $priv1 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-1" --query "Subnets[0].SubnetId" --output text)
    $priv2 = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-2" --query "Subnets[0].SubnetId" --output text)
    
    Import-Resource "aws_subnet.public[0]" $pub1
    Import-Resource "aws_subnet.public[1]" $pub2
    Import-Resource "aws_subnet.private[0]" $priv1
    Import-Resource "aws_subnet.private[1]" $priv2
    
    # 3. Discover IGW, NAT, EIP
    $igwId = (aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpcId" --query "InternetGateways[0].InternetGatewayId" --output text)
    Import-Resource "aws_internet_gateway.igw" $igwId
    
    $natId = (aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$vpcId" "Name=state,Values=available" --query "NatGateways[0].NatGatewayId" --output text)
    Import-Resource "aws_nat_gateway.nat" $natId
    
    if ($natId -and $natId -ne "None") {
        $eipAllocId = (aws ec2 describe-nat-gateways --nat-gateway-ids $natId --query "NatGateways[0].NatGatewayAddresses[0].AllocationId" --output text)
        Import-Resource "aws_eip.nat" $eipAllocId
    }
    
    # 4. Discover Route Tables
    $pubRtId = (aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-public-rt" --query "RouteTables[0].RouteTableId" --output text)
    $privRtId = (aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpcId" "Name=tag:Name,Values=cloploy-private-rt" --query "RouteTables[0].RouteTableId" --output text)
    Import-Resource "aws_route_table.public" $pubRtId
    Import-Resource "aws_route_table.private" $privRtId
    
    # 5. Discover Security Group
    $sgId = (aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpcId" "Name=group-name,Values=cloploy-eks-nodes" --query "SecurityGroups[0].GroupId" --output text)
    Import-Resource "aws_security_group.eks_nodes" $sgId
}

# 6. Discover EKS Cluster (Strictly Import, do NOT recreate)
$clusterExists = $false
aws eks describe-cluster --name cloploy-eks --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { 
    $clusterExists = $true 
    Import-Resource "aws_eks_cluster.main" "cloploy-eks"
} else {
    throw "EKS Cluster 'cloploy-eks' must exist on AWS before running this script!"
}

# 7. ECR Repositories
Import-Resource "aws_ecr_repository.web" "cloploy-web"
Import-Resource "aws_ecr_repository.api" "cloploy-api"

# 8. IAM Roles
Import-Resource "aws_iam_role.eks_cluster" "cloploy-eks-cluster-role"
Import-Resource "aws_iam_role.eks_nodes" "cloploy-eks-node-role"
Import-Resource "aws_iam_role.alb_ingress" "cloploy-eks-alb-ingress-role"
Import-Resource "aws_iam_role.autoscaler" "cloploy-eks-autoscaler-role"
Import-Resource "aws_iam_role.external_dns" "cloploy-eks-external-dns-role"

# 9. IAM Policies
Import-Resource "aws_iam_policy.alb_ingress" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-alb-ingress-policy"
Import-Resource "aws_iam_policy.autoscaler" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-autoscaler-policy"
Import-Resource "aws_iam_policy.external_dns" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-external-dns-policy"

# 10. Backend State Bucket and DynamoDB Lock Table (managed in ecr.tf)
Import-Resource "aws_s3_bucket.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_s3_bucket_versioning.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_dynamodb_table.terraform_locks" "cloploy-terraform-locks"

# --------------------------------------------------
# Phase 2: Terraform Plan and Apply
# --------------------------------------------------
Write-Host "`n--- PHASE 2: Running Terraform Apply ---" -ForegroundColor Yellow
terraform fmt
terraform validate
if ($LASTEXITCODE -ne 0) { throw "Terraform Validation failed!" }

terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Plan failed!" }

terraform apply -auto-approve tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Apply failed!" }

Write-Host "Terraform Apply completed successfully." -ForegroundColor Green
Pop-Location

# --------------------------------------------------
# Phase 3: EKS Validation
# --------------------------------------------------
Write-Host "`n--- PHASE 3: Validating EKS & Nodes ---" -ForegroundColor Cyan

Write-Host "Updating kubeconfig..." -ForegroundColor Yellow
aws eks update-kubeconfig --region $REGION --name cloploy-eks
if ($LASTEXITCODE -ne 0) { throw "Kubeconfig update failed!" }

Write-Host "Listing Node Groups for cluster 'cloploy-eks'..." -ForegroundColor Yellow
aws eks list-nodegroups --cluster-name cloploy-eks --region $REGION

Write-Host "Retrieving EKS node status..." -ForegroundColor Yellow
kubectl get nodes

# --------------------------------------------------
# Phase 4: Git Synchronization
# --------------------------------------------------
Write-Host "`n--- PHASE 4: Git Commit & Push ---" -ForegroundColor Cyan
git add .
git commit -m "feat: align state and deploy EKS Managed Node Group to cloploy-eks cluster"
git push
Write-Host "Git synchronization complete." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "    EKS MANAGED NODE GROUP DEPLOYED SUCCESSFULLY  " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
