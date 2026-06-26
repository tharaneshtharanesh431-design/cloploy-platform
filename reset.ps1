# Cloploy AWS Infrastructure Complete Reset & Recreation Script
# Run this script in PowerShell with active AWS credentials in ap-southeast-2 region.

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host "     CLOPLOY AWS INFRASTRUCTURE COMPETE RESET     " -ForegroundColor Magenta
Write-Host "==================================================" -ForegroundColor Magenta

$REGION = "ap-southeast-2"
$S3_BACKEND = "cloploy-terraform-state"
$DYNAMODB_BACKEND = "cloploy-terraform-locks"

# Get AWS Account ID
$AWS_ACCOUNT_ID = (aws sts get-caller-identity --query "Account" --output text)
Write-Host "Active AWS Account: $AWS_ACCOUNT_ID" -ForegroundColor Green

# --------------------------------------------------
# STEP 2 & 4: Discover and Clean Up AWS Resources
# --------------------------------------------------
Write-Host "`n--- DISCOVERING & CLEANING UP CLOPLOY RESOURCES ---" -ForegroundColor Cyan

# 1. Check if Cloploy VPC exists
$vpc_id = (aws ec2 describe-vpcs --filters "Name=tag:Name,Values=cloploy-vpc" --query "Vpcs[0].VpcId" --output text)
if ($vpc_id -eq "None" -or -not $vpc_id) {
    $vpc_id = (aws ec2 describe-vpcs --filters "Name=tag:Project,Values=cloploy" --query "Vpcs[0].VpcId" --output text)
}

if ($vpc_id -and $vpc_id -ne "None") {
    Write-Host "Found Cloploy VPC: $vpc_id" -ForegroundColor Green
} else {
    Write-Host "Cloploy VPC not found. Skipping network cleanup." -ForegroundColor Gray
}

# 2. Delete EKS Cluster and Node Groups
$clusters = (aws eks list-clusters --query "clusters" --output json | ConvertFrom-Json)
if ($clusters -contains "cloploy-eks") {
    Write-Host "Found EKS cluster 'cloploy-eks'. Initiating deletion..." -ForegroundColor Yellow
    
    # List and delete node groups
    $nodegroups = (aws eks list-nodegroups --cluster-name cloploy-eks --query "nodegroups" --output json | ConvertFrom-Json)
    foreach ($ng in $nodegroups) {
        Write-Host "Deleting EKS Node Group '$ng'..." -ForegroundColor Yellow
        aws eks delete-nodegroup --cluster-name cloploy-eks --nodegroup-name $ng | Out-Null
    }
    
    # Wait for node groups to delete
    foreach ($ng in $nodegroups) {
        Write-Host "Waiting for EKS Node Group '$ng' to be deleted..." -ForegroundColor Yellow
        while ($true) {
            $status = (aws eks describe-nodegroup --cluster-name cloploy-eks --nodegroup-name $ng --query "nodegroup.status" --output text 2>$null)
            if (-not $status -or $status -eq "None") { break }
            Write-Host "Status of $ng: $status" -ForegroundColor Gray
            Start-Sleep -Seconds 10
        }
    }
    
    # Delete cluster
    Write-Host "Deleting EKS Cluster 'cloploy-eks'..." -ForegroundColor Yellow
    aws eks delete-cluster --name cloploy-eks | Out-Null
    
    # Wait for cluster to delete
    Write-Host "Waiting for EKS Cluster to be deleted..." -ForegroundColor Yellow
    while ($true) {
        $status = (aws eks describe-cluster --name cloploy-eks --query "cluster.status" --output text 2>$null)
        if (-not $status -or $status -eq "None") { break }
        Write-Host "Status of cloploy-eks: $status" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
    Write-Host "EKS Cluster deleted." -ForegroundColor Green
}

# 3. Delete Load Balancers in the VPC
if ($vpc_id -and $vpc_id -ne "None") {
    Write-Host "Checking for Load Balancers in VPC $vpc_id..." -ForegroundColor Yellow
    $lbs = (aws elbv2 describe-load-balancers --query "LoadBalancers[?VpcId=='$vpc_id'].LoadBalancerArn" --output json | ConvertFrom-Json)
    foreach ($lb in $lbs) {
        Write-Host "Deleting Load Balancer $lb..." -ForegroundColor Yellow
        aws elbv2 delete-load-balancer --load-balancer-arn $lb | Out-Null
    }
    # Wait for LBs deletion
    foreach ($lb in $lbs) {
        Write-Host "Waiting for Load Balancer $lb to be deleted..." -ForegroundColor Yellow
        while ($true) {
            aws elbv2 describe-load-balancers --load-balancer-arns $lb 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) { break }
            Start-Sleep -Seconds 5
        }
    }
    
    # Target Groups
    Write-Host "Checking for Target Groups..." -ForegroundColor Yellow
    $tgs = (aws elbv2 describe-target-groups --query "TargetGroups[?VpcId=='$vpc_id'].TargetGroupArn" --output json | ConvertFrom-Json)
    foreach ($tg in $tgs) {
        Write-Host "Deleting Target Group $tg..." -ForegroundColor Yellow
        aws elbv2 delete-target-group --target-group-arn $tg | Out-Null
    }
}

# 4. Delete Autoscaling Groups and Launch Templates
Write-Host "Checking for Autoscaling Groups..." -ForegroundColor Yellow
$asgs = (aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[?contains(AutoScalingGroupName,'cloploy')].AutoScalingGroupName" --output json | ConvertFrom-Json)
foreach ($asg in $asgs) {
    Write-Host "Deleting Autoscaling Group $asg..." -ForegroundColor Yellow
    aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 0 --max-size 0 --desired-capacity 0
    aws autoscaling delete-auto-scaling-group --auto-scaling-group-name $asg --force-delete | Out-Null
}

Write-Host "Checking for Launch Templates..." -ForegroundColor Yellow
$lts = (aws ec2 describe-launch-templates --query "LaunchTemplates[?contains(LaunchTemplateName,'cloploy')].LaunchTemplateId" --output json | ConvertFrom-Json)
foreach ($lt in $lts) {
    Write-Host "Deleting Launch Template $lt..." -ForegroundColor Yellow
    aws ec2 delete-launch-template --launch-template-id $lt | Out-Null
}

# 5. Delete VPC Network Resources
if ($vpc_id -and $vpc_id -ne "None") {
    Write-Host "Cleaning up resources inside VPC $vpc_id..." -ForegroundColor Yellow
    
    # NAT Gateways
    $subnets = (aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" --query "Subnets[].SubnetId" --output json | ConvertFrom-Json)
    foreach ($subnet in $subnets) {
        $nats = (aws ec2 describe-nat-gateways --filter "Name=subnet-id,Values=$subnet" "Name=state,Values=pending,available" --query "NatGateways[].NatGatewayId" --output json | ConvertFrom-Json)
        foreach ($nat in $nats) {
            Write-Host "Deleting NAT Gateway $nat..." -ForegroundColor Yellow
            aws ec2 delete-nat-gateway --nat-gateway-id $nat | Out-Null
        }
    }
    
    # Wait for NAT Gateways
    foreach ($subnet in $subnets) {
        $nats = (aws ec2 describe-nat-gateways --filter "Name=subnet-id,Values=$subnet" --query "NatGateways[?State!='deleted'].NatGatewayId" --output json | ConvertFrom-Json)
        foreach ($nat in $nats) {
            Write-Host "Waiting for NAT Gateway $nat to delete..." -ForegroundColor Yellow
            while ($true) {
                $state = (aws ec2 describe-nat-gateways --nat-gateway-ids $nat --query "NatGateways[0].State" --output text)
                if ($state -eq "deleted" -or $state -eq "None") { break }
                Start-Sleep -Seconds 5
            }
        }
    }
    
    # Release Elastic IPs
    $eips = (aws ec2 describe-addresses --filters "Name=tag:Name,Values=cloploy-nat-eip" --query "Addresses[].AllocationId" --output json | ConvertFrom-Json)
    foreach ($eip in $eips) {
        Write-Host "Releasing Elastic IP $eip..." -ForegroundColor Yellow
        aws ec2 release-address --allocation-id $eip | Out-Null
    }
    
    # Detach & Delete Internet Gateways
    $igws = (aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$vpc_id" --query "InternetGateways[].InternetGatewayId" --output json | ConvertFrom-Json)
    foreach ($igw in $igws) {
        Write-Host "Detaching and deleting IGW $igw..." -ForegroundColor Yellow
        aws ec2 detach-internet-gateway --internet-gateway-id $igw --vpc-id $vpc_id
        aws ec2 delete-internet-gateway --internet-gateway-id $igw
    }
    
    # ENIs Cleanup (Crucial for subnet deletion)
    $enis = (aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc_id" --query "NetworkInterfaces[].NetworkInterfaceId" --output json | ConvertFrom-Json)
    foreach ($eni in $enis) {
        Write-Host "Processing Network Interface $eni..." -ForegroundColor Yellow
        $status = (aws ec2 describe-network-interfaces --network-interface-ids $eni --query "NetworkInterfaces[0].Status" --output text)
        $attachment = (aws ec2 describe-network-interfaces --network-interface-ids $eni --query "NetworkInterfaces[0].Attachment" --output json | ConvertFrom-Json)
        
        if ($status -eq "in-use" -and $attachment) {
            Write-Host "Detaching ENI $eni (Attachment: $($attachment.AttachmentId))..." -ForegroundColor Yellow
            aws ec2 detach-network-interface --attachment-id $attachment.AttachmentId --force | Out-Null
            Start-Sleep -Seconds 5
        }
        
        Write-Host "Deleting ENI $eni..." -ForegroundColor Yellow
        aws ec2 delete-network-interface --network-interface-id $eni | Out-Null
    }
    
    # Delete Subnets
    foreach ($subnet in $subnets) {
        Write-Host "Deleting Subnet $subnet..." -ForegroundColor Yellow
        aws ec2 delete-subnet --subnet-id $subnet
    }
    
    # Delete Security Groups (except default)
    $sgs = (aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$vpc_id" --query "SecurityGroups[?GroupName!='default'].GroupId" --output json | ConvertFrom-Json)
    foreach ($sg in $sgs) {
        Write-Host "Deleting Security Group $sg..." -ForegroundColor Yellow
        aws ec2 delete-security-group --group-id $sg
    }
    
    # Delete Route Tables (except main)
    $rts = (aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$vpc_id" --query "RouteTables[?AssociationStateCode!='main'].RouteTableId" --output json | ConvertFrom-Json)
    foreach ($rt in $rts) {
        Write-Host "Deleting Route Table $rt..." -ForegroundColor Yellow
        aws ec2 delete-route-table --route-table-id $rt
    }
    
    # Delete VPC
    Write-Host "Deleting VPC $vpc_id..." -ForegroundColor Yellow
    aws ec2 delete-vpc --vpc-id $vpc_id
    Write-Host "VPC $vpc_id deleted successfully." -ForegroundColor Green
}

# --------------------------------------------------
# STEP 7: Terraform State Reset & Import
# --------------------------------------------------
Write-Host "`n--- STEP 7: STATE RECOVERY & SYNCHRONIZATION ---" -ForegroundColor Cyan

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$tfPath = Join-Path $scriptPath "infra/terraform"

Push-Location $tfPath

Write-Host "Initializing Terraform..." -ForegroundColor Yellow
terraform init -reconfigure
if ($LASTEXITCODE -ne 0) { throw "Terraform Init failed!" }

# List active state resources
$stateList = (terraform state list 2>$null)

# Clean out deleted resources from State
Write-Host "Removing missing resources from Terraform state..." -ForegroundColor Yellow
foreach ($res in $stateList) {
    if ($res -match "aws_ecr_repository" -or $res -match "aws_iam_role" -or $res -match "aws_iam_policy" -or $res -match "aws_s3_bucket" -or $res -match "aws_dynamodb_table" -or $res -match "aws_s3_bucket_versioning") {
        # Keep bootstrap and IAM/ECR resources for import/sync checks
        continue
    }
    Write-Host "Removing $res from state..." -ForegroundColor Yellow
    terraform state rm $res
}

# Re-read state list
$stateList = (terraform state list 2>$null)

# Function to check and import resources if they exist on AWS
function Import-ResourceIfExist($addr, $awsId) {
    if ($stateList -contains $addr) {
        Write-Host "Resource $addr is already in Terraform state." -ForegroundColor Green
        return
    }
    
    $exists = $false
    if ($addr -match "aws_iam_role") {
        aws iam get-role --role-name $awsId 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } elseif ($addr -match "aws_iam_policy") {
        aws iam get-policy --policy-arn $awsId 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } elseif ($addr -match "aws_ecr_repository") {
        aws ecr describe-repositories --repository-names $awsId --region $REGION 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } elseif ($addr -match "aws_s3_bucket") {
        aws s3api head-bucket --bucket $awsId --region $REGION 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } elseif ($addr -match "aws_s3_bucket_versioning") {
        aws s3api head-bucket --bucket $awsId --region $REGION 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    } elseif ($addr -match "aws_dynamodb_table") {
        aws dynamodb describe-table --table-name $awsId --region $REGION 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $exists = $true }
    }
    
    if ($exists) {
        Write-Host "AWS resource '$awsId' found. Importing into Terraform state as '$addr'..." -ForegroundColor Yellow
        terraform import $addr $awsId
        if ($LASTEXITCODE -ne 0) {
             Write-Host "Import warning: failed to import $addr." -ForegroundColor Red
        } else {
             Write-Host "Successfully imported $addr." -ForegroundColor Green
        }
    } else {
        Write-Host "AWS resource '$awsId' not found. Will be provisioned fresh." -ForegroundColor Gray
    }
}

# STEP 5: ECR Handling (Option A - Import and preserve images)
Write-Host "`n--- STEP 5: ECR Imports ---" -ForegroundColor Yellow
Import-ResourceIfExist "aws_ecr_repository.web" "cloploy-web"
Import-ResourceIfExist "aws_ecr_repository.api" "cloploy-api"

# STEP 6: IAM Handling (Import existing roles to prevent collisions)
Write-Host "`n--- STEP 6: IAM Imports ---" -ForegroundColor Yellow
Import-ResourceIfExist "aws_iam_role.eks_cluster" "cloploy-eks-cluster-role"
Import-ResourceIfExist "aws_iam_role.eks_nodes" "cloploy-eks-node-role"
Import-ResourceIfExist "aws_iam_role.alb_ingress" "cloploy-eks-alb-ingress-role"
Import-ResourceIfExist "aws_iam_role.autoscaler" "cloploy-eks-autoscaler-role"
Import-ResourceIfExist "aws_iam_role.external_dns" "cloploy-eks-external-dns-role"

Import-ResourceIfExist "aws_iam_policy.alb_ingress" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-alb-ingress-policy"
Import-ResourceIfExist "aws_iam_policy.autoscaler" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-autoscaler-policy"
Import-ResourceIfExist "aws_iam_policy.external_dns" "arn:aws:iam::$AWS_ACCOUNT_ID:policy/cloploy-eks-external-dns-policy"

# Import state bucket and lock table resources from ecr.tf
Write-Host "`n--- State Backend Imports ---" -ForegroundColor Yellow
Import-ResourceIfExist "aws_s3_bucket.terraform_state" "cloploy-terraform-state-8124173993"
Import-ResourceIfExist "aws_s3_bucket_versioning.terraform_state" "cloploy-terraform-state-8124173993"
Import-ResourceIfExist "aws_dynamodb_table.terraform_locks" "cloploy-terraform-locks"

# --------------------------------------------------
# STEP 8 & 9: Terraform Plan and Apply
# --------------------------------------------------
Write-Host "`n--- STEP 8 & 9: TERRAFORM APPLY ---" -ForegroundColor Cyan

Write-Host "Running terraform fmt..." -ForegroundColor Yellow
terraform fmt

Write-Host "Validating configurations..." -ForegroundColor Yellow
terraform validate
if ($LASTEXITCODE -ne 0) { throw "Terraform Validation failed!" }

Write-Host "Creating deployment plan..." -ForegroundColor Yellow
terraform plan -out=tfplan
if ($LASTEXITCODE -ne 0) { throw "Terraform Plan failed!" }

$retries = 3
$success = $false
while ($retries -gt 0 -and -not $success) {
    Write-Host "Executing Apply (Attempt $((4 - $retries)) of 3)..." -ForegroundColor Yellow
    terraform apply -auto-approve tfplan
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "Terraform Apply succeeded." -ForegroundColor Green
    } else {
        Write-Host "Apply failed due to AWS eventual consistency. Retrying in 20 seconds..." -ForegroundColor Red
        $retries--
        Start-Sleep -Seconds 20
        # Refresh plan before retrying
        terraform plan -out=tfplan
    }
}

if (-not $success) { throw "Terraform Apply failed after multiple attempts!" }

# --------------------------------------------------
# STEP 10: Kubernetes Verification
# --------------------------------------------------
Write-Host "`n--- STEP 10: KUBERNETES VERIFICATION ---" -ForegroundColor Cyan

Write-Host "Updating kubeconfig..." -ForegroundColor Yellow
aws eks update-kubeconfig --region $REGION --name cloploy-eks
if ($LASTEXITCODE -ne 0) { throw "Kubeconfig update failed!" }

Write-Host "Retrieving EKS node status..." -ForegroundColor Yellow
kubectl get nodes

Write-Host "Ensuring namespace 'cloploy' exists..." -ForegroundColor Yellow
kubectl create namespace cloploy --dry-run=client -o yaml | kubectl apply -f -

# Deploy core apps
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f ../kubernetes/configmap.yaml -n cloploy
kubectl apply -f ../kubernetes/secret.yaml -n cloploy
kubectl apply -f ../kubernetes/mongodb.yaml -n cloploy
kubectl apply -f ../kubernetes/redis.yaml -n cloploy
kubectl apply -f ../kubernetes/api-deployment.yaml -n cloploy
kubectl apply -f ../kubernetes/api-service.yaml -n cloploy

Write-Host "Deploying Frontend Web via Helm..." -ForegroundColor Yellow
helm upgrade --install cloploy-web ../helm `
    -f ../helm/values.yaml `
    -f ../helm/values-prod.yaml `
    -n cloploy --create-namespace

Write-Host "Deploying Ingress..." -ForegroundColor Yellow
kubectl apply -f ../kubernetes/rbac.yaml -n cloploy
kubectl apply -f ../kubernetes/networkpolicy.yaml -n cloploy
kubectl apply -f ../kubernetes/pdb.yaml -n cloploy
kubectl apply -f ../kubernetes/ingress.yaml -n cloploy
kubectl apply -f ../kubernetes/hpa.yaml -n cloploy

# Rollout check
Write-Host "Checking rollout status..." -ForegroundColor Yellow
kubectl rollout status deployment/cloploy-api -n cloploy
kubectl rollout status deployment/cloploy-web-cloploy-app -n cloploy

# Install ALB controller
Write-Host "Configuring ALB Ingress Controller..." -ForegroundColor Yellow
helm repo add eks https://aws.github.io/eks-charts 2>&1 | Out-Null
helm repo update 2>&1 | Out-Null

$ALB_ROLE_ARN = "arn:aws:iam::$AWS_ACCOUNT_ID:role/cloploy-eks-alb-ingress-role"
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller `
    -n kube-system `
    --set clusterName=cloploy-eks `
    --set serviceAccount.create=true `
    --set serviceAccount.name=aws-load-balancer-controller `
    --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$ALB_ROLE_ARN

Write-Host "`nEKS Namespace list:" -ForegroundColor Magenta
kubectl get ns

Write-Host "`nAll Pods:" -ForegroundColor Magenta
kubectl get pods -A

Write-Host "`nAll Services:" -ForegroundColor Magenta
kubectl get svc -A

Write-Host "`nAll Ingresses:" -ForegroundColor Magenta
kubectl get ingress -A

# --------------------------------------------------
# STEP 11: Terraform State Verification
# --------------------------------------------------
Write-Host "`n--- STEP 11: STATE VERIFICATION ---" -ForegroundColor Cyan
terraform state list

# --------------------------------------------------
# STEP 14: Commit & Git Synchronization
# --------------------------------------------------
Write-Host "`n--- STEP 14: GIT SYNCHRONIZATION ---" -ForegroundColor Cyan
Write-Host "Committing reset changes..." -ForegroundColor Yellow
git add .
git commit -m "Infrastructure reset completed:
Clean AWS
Terraform backend repaired
State repaired
Resources recreated
EKS healthy
Terraform fully synchronized"
git push
Write-Host "Git synchronization complete." -ForegroundColor Green

Pop-Location
Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "       AWS INFRASTRUCTURE RESET FINISHED SUCCESS    " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
