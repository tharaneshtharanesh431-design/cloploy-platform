pipeline {
  agent any

  environment {
    AWS_REGION          = 'ap-southeast-2'
    ECR_REGISTRY        = '344626518012.dkr.ecr.ap-southeast-2.amazonaws.com'
    CLUSTER_NAME        = 'cloploy-eks'
    SONARQUBE_URL       = 'http://sonarqube:9000'
    SONAR_TOKEN         = credentials('sonarqube-token')
    AWS_CREDENTIALS_ID  = 'aws-credentials'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Unit Tests') {
      steps {
        sh 'npm test --if-present'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('SonarQubeServer') {
          sh "sonar-scanner \
            -Dsonar.projectKey=cloploy-platform \
            -Dsonar.projectName=cloploy-platform \
            -Dsonar.sources=. \
            -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/**,**/build/**,**/.terraform/**,**/mongo_db_data/**"
        }
      }
    }

    stage('SonarQube Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t ${ECR_REGISTRY}/cloploy-api:${BUILD_NUMBER} -t ${ECR_REGISTRY}/cloploy-api:latest ./apps/api'
        sh 'docker build -t ${ECR_REGISTRY}/cloploy-web:${BUILD_NUMBER} -t ${ECR_REGISTRY}/cloploy-web:latest ./apps/web'
      }
    }

    stage('Docker Push ECR') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
          sh 'aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}'
          sh 'docker push ${ECR_REGISTRY}/cloploy-api:${BUILD_NUMBER}'
          sh 'docker push ${ECR_REGISTRY}/cloploy-api:latest'
          sh 'docker push ${ECR_REGISTRY}/cloploy-web:${BUILD_NUMBER}'
          sh 'docker push ${ECR_REGISTRY}/cloploy-web:latest'
        }
      }
    }

    stage('Terraform Apply') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
          dir('infra/terraform') {
            sh 'terraform init'
            sh 'terraform validate'
            sh 'terraform plan -out=tfplan'
            sh 'terraform apply -auto-approve tfplan'
          }
        }
      }
    }

    stage('Kubernetes Deploy') {
      steps {
        withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: env.AWS_CREDENTIALS_ID]]) {
          sh 'aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}'
          
          // Apply standard K8s objects (RBAC, Secret, ConfigMap)
          sh 'kubectl apply -f infra/kubernetes/rbac.yaml'
          sh 'kubectl apply -f infra/kubernetes/secret.yaml'
          sh 'kubectl apply -f infra/kubernetes/configmap.yaml'
          sh 'kubectl apply -f infra/kubernetes/networkpolicy.yaml'
          sh 'kubectl apply -f infra/kubernetes/pdb.yaml'
          
          // Deploy Web app via Helm
          sh "helm upgrade --install cloploy-web ./infra/helm \
            -f ./infra/helm/values.yaml \
            -f ./infra/helm/values-prod.yaml \
            --set image.tag=${BUILD_NUMBER} \
            -n cloploy --create-namespace"
          
          // Deploy API and Ingress via kubectl
          sh 'kubectl apply -f infra/kubernetes/api-deployment.yaml'
          sh 'kubectl apply -f infra/kubernetes/api-service.yaml'
          sh 'kubectl apply -f infra/kubernetes/ingress.yaml'
          sh 'kubectl apply -f infra/kubernetes/hpa.yaml'
          
          // Verify rollout status
          sh 'kubectl rollout status deployment/cloploy-api -n cloploy'
          sh 'kubectl rollout status deployment/cloploy-web-cloploy-app -n cloploy'
        }
      }
    }
  }

  post {
    always {
      // Cleanup stage
      sh 'docker rmi ${ECR_REGISTRY}/cloploy-api:${BUILD_NUMBER} || true'
      sh 'docker rmi ${ECR_REGISTRY}/cloploy-web:${BUILD_NUMBER} || true'
      echo 'Pipeline run completed. Cleaned up build images.'
    }
    success {
      echo 'SUCCESS: Cloploy pipeline completed successfully. Slack notification sent (placeholder).'
    }
    failure {
      echo 'FAILURE: Cloploy pipeline failed. Slack notification sent (placeholder).'
    }
  }
}
