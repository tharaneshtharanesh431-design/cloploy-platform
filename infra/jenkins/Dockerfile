FROM jenkins/jenkins:lts-jdk21

# Switch to root to perform tool installations
USER root

# Prevent interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive

# Copy plugins.txt, casc.yaml and install-tools.sh
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
COPY casc.yaml /usr/share/jenkins/ref/casc.yaml
COPY install-tools.sh /tmp/install-tools.sh

# Execute tool installation script
RUN chmod +x /tmp/install-tools.sh && \
    /tmp/install-tools.sh && \
    rm /tmp/install-tools.sh

# Set configuration environment variables
ENV CASC_JENKINS_CONFIG=/usr/share/jenkins/ref/casc.yaml
ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

# Switch back to the non-root jenkins user
USER jenkins

# Pre-install Jenkins plugins defined in plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt
