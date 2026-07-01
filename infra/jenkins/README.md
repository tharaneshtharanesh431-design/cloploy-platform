# Custom Enterprise Jenkins Infrastructure for Cloploy

This directory contains the custom, production-grade Jenkins image configuration designed to provide a comprehensive, pre-configured execution environment for the Cloploy CI/CD pipeline.

---

## 1. Directory Structure

* `Dockerfile`: The instructions to build the customized Jenkins image containing all development tools.
* `plugins.txt`: List of required plugins pre-installed during the Docker build stage.
* `casc.yaml`: Jenkins Configuration-as-Code (JCasC) definition to initialize settings (e.g. disabling the setup wizard, creating default admin credentials, and configuring global SonarQube servers).
* `install-tools.sh`: A modular installation script executed during build-time to download, install, and configure development runtimes and CLI utilities.

---

## 2. Explanation of Changes

1. **JDK 21 Base Upgrade:** Shifted from standard `lts-jdk17` to `lts-jdk21` to run the Jenkins orchestrator on a modern, long-term support Java environment.
2. **Pre-Installed Tools & Runtimes:** The image compiles NodeJS LTS (20.x), Yarn, pnpm, Terraform, kubectl, Helm, AWS CLI v2, SonarScanner CLI, and Trivy. All binaries are placed in `/usr/local/bin` and `/opt` to prevent `command not found` pipeline errors.
3. **No-Root Host Docker Integration:** The container mounts `/var/run/docker.sock` to delegate Docker builds directly to the host's Docker daemon. The `jenkins` user is automatically appended to the container's `docker` group (standard GID `999`).
4. **Configuration as Code (JCasC):** Enabled JCasC via `casc.yaml`. This completely disables the initial setup wizard, configures the initial admin credentials, and configures the SonarQube Server connection so `withSonarQubeEnv('SonarQubeServer')` works out of the box.

---

## 3. Migration & Rebuild Instructions

### Rebuild and Start the Infrastructure
To build the new image and start Jenkins alongside other services, run:

```bash
# Force docker-compose to build the custom image from context
docker compose build jenkins

# Start the cluster
docker compose up -d jenkins
```

### Verification Commands
Once the container starts, execute the following commands in the running container to verify that all tools are loaded correctly:

```bash
# Exec command to check versions of installed tools inside the running container
docker exec -it cloploy-jenkins node -v
docker exec -it cloploy-jenkins npm -v
docker exec -it cloploy-jenkins pnpm -v
docker exec -it cloploy-jenkins yarn -v
docker exec -it cloploy-jenkins docker --version
docker exec -it cloploy-jenkins aws --version
docker exec -it cloploy-jenkins terraform version
docker exec -it cloploy-jenkins kubectl version --client
docker exec -it cloploy-jenkins helm version
docker exec -it cloploy-jenkins sonar-scanner --version
docker exec -it cloploy-jenkins trivy --version
docker exec -it cloploy-jenkins git --version
docker exec -it cloploy-jenkins python3 --version
docker exec -it cloploy-jenkins jq --version
```

---

## 4. Rollback Procedure

If you encounter any issues and need to revert back to the original Jenkins configuration:

1. Revert `docker-compose.yml` to the original image reference:
   ```yaml
     jenkins:
       image: jenkins/jenkins:lts-jdk17
       container_name: cloploy-jenkins
       restart: unless-stopped
       ports:
         - "8081:8080"
         - "50000:50000"
       volumes:
         - jenkins_home:/var/jenkins_home
   ```
2. Remove any cached custom builds and restart the container:
   ```bash
   docker compose down jenkins
   docker compose up -d jenkins
   ```
