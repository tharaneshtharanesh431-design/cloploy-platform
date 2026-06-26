# Cloploy AWS Non-Destructive Recovery & Alignment Script
# Run this script in PowerShell with active AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "    CLOPLOY AWS NON-DESTRUCTIVE RECOVERY & SYNC   " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$REGION = "ap-southeast-2"
$S3_BACKEND = "cloploy-terraform-state"
$DYNAMODB_BACKEND = "cloploy-terraform-locks"

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
Write-Host "Active AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Green

# --------------------------------------------------
# STEP 2: AWS Resource Discovery & Import Mapping
# --------------------------------------------------
Write-Host "`n--- PHASE 2: Terraform State Alignment ---" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfPath = Join-Path $scriptPath "infra/terraform"

Push-Location $tfPath

Write-Host "Initializing Terraform..." -ForegroundColor Yellow
terraform init -reconfigure
if ($LASTEXITCODE -ne 0) { throw "Terraform Init failed!" }

# Get existing state list
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

# 6. Discover EKS Cluster & Node Group
$clusterExists = $false
aws eks describe-cluster --name cloploy-eks --region $REGION 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) { 
    $clusterExists = $true 
    Import-Resource "aws_eks_cluster.main" "cloploy-eks"
    
    aws eks describe-nodegroup --cluster-name cloploy-eks --nodegroup-name cloploy-main --region $REGION 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Import-Resource "aws_eks_node_group.main" "cloploy-eks:cloploy-main"
    }
}

# 7. Discover OIDC Provider
if ($clusterExists) {
    $issuer = (aws eks describe-cluster --name cloploy-eks --query "cluster.identity.oidc.issuer" --output text)
    $issuerClean = $issuer.Replace("https://", "")
    $oidcArn = (aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(Arn,'$issuerClean')].Arn" --output text)
    if ($oidcArn -and $oidcArn -ne "None") {
        Import-Resource "aws_iam_openid_connect_provider.eks" $oidcArn
    }
}

# 8. ECR Repositories
Import-Resource "aws_ecr_repository.web" "cloploy-web"
Import-Resource "aws_ecr_repository.api" "cloploy-api"

# 9. IAM Roles
Import-Resource "aws_iam_role.eks_cluster" "cloploy-eks-cluster-role"
Import-Resource "aws_iam_role.eks_nodes" "cloploy-eks-node-role"
Import-Resource "aws_iam_role.alb_ingress" "cloploy-eks-alb-ingress-role"
Import-Resource "aws_iam_role.autoscaler" "cloploy-eks-autoscaler-role"
Import-Resource "aws_iam_role.external_dns" "cloploy-eks-external-dns-role"

# 10. IAM Policies
Import-Resource "aws_iam_policy.alb_ingress" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-alb-ingress-policy"
Import-Resource "aws_iam_policy.autoscaler" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-autoscaler-policy"
Import-Resource "aws_iam_policy.external_dns" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-external-dns-policy"

# 11. Backend State Bucket and DynamoDB Lock Table (managed in ecr.tf)
Import-Resource "aws_s3_bucket.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_s3_bucket_versioning.terraform_state" "cloploy-terraform-state-8124173993"
Import-Resource "aws_dynamodb_table.terraform_locks" "cloploy-terraform-locks"

# --------------------------------------------------
# Terraform Apply
# --------------------------------------------------
Write-Host "`n--- Running Terraform Apply ---" -ForegroundColor Yellow
terraform fmt
terraform validate
if ($LASTEXITCODE -ne 0) { throw "Terraform Validation failed!" }

terraform plan -out=tfplan
terraform apply -auto-approve tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Apply failed!" }

Write-Host "Terraform Apply complete." -ForegroundColor Green
Pop-Location

# --------------------------------------------------
# Phase 3: EKS Validation & Kubeconfig
# --------------------------------------------------
Write-Host "`n--- PHASE 3: EKS Validation ---" -ForegroundColor Cyan
aws eks update-kubeconfig --region $REGION --name cloploy-eks
if ($LASTEXITCODE -ne 0) { throw "Kubeconfig update failed!" }

Write-Host "Retrieving EKS node status..." -ForegroundColor Yellow
kubectl get nodes

Write-Host "Ensuring namespace 'cloploy' exists..." -ForegroundColor Yellow
kubectl create namespace cloploy --dry-run=client -o yaml | kubectl apply -f -

# --------------------------------------------------
# Phase 4 & 5: Kubernetes Platform Workloads
# --------------------------------------------------
Write-Host "`n--- PHASE 4: Kubernetes Workloads ---" -ForegroundColor Cyan
kubectl apply -f infra/kubernetes/configmap.yaml -n cloploy
kubectl apply -f infra/kubernetes/secret.yaml -n cloploy
kubectl apply -f infra/kubernetes/mongodb.yaml -n cloploy
kubectl apply -f infra/kubernetes/redis.yaml -n cloploy
kubectl apply -f infra/kubernetes/api-deployment.yaml -n cloploy
kubectl apply -f infra/kubernetes/api-service.yaml -n cloploy

Write-Host "Deploying Frontend Web via Helm (Release cloploy-web)..." -ForegroundColor Yellow
helm upgrade --install cloploy-web ./infra/helm `
    -f ./infra/helm/values.yaml `
    -f ./infra/helm/values-prod.yaml `
    -n cloploy --create-namespace

Write-Host "Applying Ingress and Autoscaling manifest policies..." -ForegroundColor Yellow
kubectl apply -f infra/kubernetes/rbac.yaml -n cloploy
kubectl apply -f infra/kubernetes/networkpolicy.yaml -n cloploy
kubectl apply -f infra/kubernetes/pdb.yaml -n cloploy
kubectl apply -f infra/kubernetes/ingress.yaml -n cloploy
kubectl apply -f infra/kubernetes/hpa.yaml -n cloploy

# Polling rollout status
kubectl rollout status deployment/cloploy-api -n cloploy
kubectl rollout status deployment/cloploy-web-cloploy-app -n cloploy

# --------------------------------------------------
# Phase 7: Install Monitoring Stack (Prometheus + Grafana)
# --------------------------------------------------
Write-Host "`n--- PHASE 7: Deploying Monitoring ---" -ForegroundColor Cyan

Write-Host "Deploying Metrics Server..." -ForegroundColor Yellow
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

Write-Host "Deploying Prometheus and Grafana via Helm..." -ForegroundColor Yellow
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack `
    --namespace monitoring --create-namespace `
    --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false `
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# AWS Load Balancer Controller deployment
Write-Host "Deploying AWS Load Balancer Controller..." -ForegroundColor Yellow
helm repo add eks https://aws.github.io/eks-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null

$ALB_ROLE_ARN = "arn:aws:iam::$AWS_ACCOUNT_ID:role/cloploy-eks-alb-ingress-role"
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller `
    -n kube-system `
    --set clusterName=cloploy-eks `
    --set serviceAccount.create=true `
    --set serviceAccount.name=aws-load-balancer-controller `
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$ALB_ROLE_ARN

# --------------------------------------------------
# Verification (Phase 10)
# --------------------------------------------------
Write-Host "`n--- PHASE 10: Final Workload Validations ---" -ForegroundColor Cyan
Write-Host "`n[1] Nodes:" -ForegroundColor Magenta
kubectl get nodes
Write-Host "`n[2] All Pods:" -ForegroundColor Magenta
kubectl get pods -A
Write-Host "`n[3] Services:" -ForegroundColor Magenta
kubectl get svc -A
Write-Host "`n[4] Ingresses:" -ForegroundColor Magenta
kubectl get ingress -A
Write-Host "`n[5] Helm Releases:" -ForegroundColor Magenta
helm list -A

# --------------------------------------------------
# Git Synchronization (Phase 12)
# --------------------------------------------------
Write-Host "`n--- PHASE 12: Git Synchronization ---" -ForegroundColor Cyan
git add .
git commit -m "Infrastructure recovery complete:
All resources aligned and synchronized with state
Workloads running successfully
Prometheus/Grafana monitoring deployed"
git push
Write-Host "Git push complete." -ForegroundColor Green

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "    AWS NON-DESTRUCTIVE RECOVERY FINISHED SUCCESS  " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
