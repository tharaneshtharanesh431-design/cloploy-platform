#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# SYSTEM UTILITIES
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing system packages ==="
apt-get update
apt-get install -y --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    curl \
    wget \
    git \
    jq \
    zip \
    unzip \
    tar \
    make \
    vim \
    nano \
    bash \
    python3 \
    python3-pip \
    python3-venv \
    sudo

# ──────────────────────────────────────────────────────────────────────────────
# YQ (YAML Processor)
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing yq ==="
YQ_VERSION="v4.44.1"
wget https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 -O /usr/local/bin/yq
chmod +x /usr/local/bin/yq

# ──────────────────────────────────────────────────────────────────────────────
# NODEJS, NPM, PNPM, YARN
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing NodeJS, NPM, pnpm, Yarn ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pnpm yarn

# ──────────────────────────────────────────────────────────────────────────────
# DOCKER CLI (No Daemon)
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing Docker CLI ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin

# ──────────────────────────────────────────────────────────────────────────────
# AWS CLI v2
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing AWS CLI v2 ==="
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# ──────────────────────────────────────────────────────────────────────────────
# TERRAFORM
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing Terraform ==="
curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com/ $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list
apt-get update
apt-get install -y terraform

# ──────────────────────────────────────────────────────────────────────────────
# KUBECTL
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing kubectl ==="
KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)
curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# ──────────────────────────────────────────────────────────────────────────────
# HELM
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing Helm ==="
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor -o /usr/share/keyrings/helm.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | tee /etc/apt/sources.list.d/helm-stable-debian.list
apt-get update
apt-get install -y helm

# ──────────────────────────────────────────────────────────────────────────────
# SONAR SCANNER CLI
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing Sonar Scanner CLI ==="
SONAR_VERSION="6.0.0.4432"
curl -fsSL "https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_VERSION}-linux-x64.zip" -o "sonar-scanner.zip"
unzip -q sonar-scanner.zip
mv "sonar-scanner-${SONAR_VERSION}-linux-x64" /opt/sonar-scanner
ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner
rm sonar-scanner.zip

# Configure default SonarQube Server address
sed -i 's/#sonar.host.url=http:\/\/localhost:9000/sonar.host.url=http:\/\/sonarqube:9000/g' /opt/sonar-scanner/conf/sonar-scanner.properties

# ──────────────────────────────────────────────────────────────────────────────
# TRIVY
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Installing Trivy ==="
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor -o /usr/share/keyrings/trivy.gpg
echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/trivy.list
apt-get update
apt-get install -y trivy

# ──────────────────────────────────────────────────────────────────────────────
# DOCKER USER GROUP PERMISSIONS
# ──────────────────────────────────────────────────────────────────────────────
# Ensure the docker group exists (standard GID 999 for compatibility with most hosts)
if ! getent group docker >/dev/null; then
    groupadd -g 999 docker
fi
# Add jenkins user to the docker group
usermod -aG docker jenkins

# Enable passwordless sudo for jenkins only for docker socket chmod if needed
echo "jenkins ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# ──────────────────────────────────────────────────────────────────────────────
# CLEAN UP
# ──────────────────────────────────────────────────────────────────────────────
echo "=== Cleaning up build caches ==="
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
echo "=== Install script finished successfully! ==="
