export function generateK8sManifests({ project, image, namespace }) {
  const appName = project.slug;
  return {
    deployment: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${appName}\n  namespace: ${namespace}\nspec:\n  replicas: 2\n  selector:\n    matchLabels:\n      app: ${appName}\n  template:\n    metadata:\n      labels:\n        app: ${appName}\n    spec:\n      containers:\n        - name: ${appName}\n          image: ${image}\n          ports:\n            - containerPort: 80\n          resources:\n            requests:\n              cpu: \"250m\"\n              memory: \"256Mi\"\n            limits:\n              cpu: \"500m\"\n              memory: \"512Mi\"`,
    service: `apiVersion: v1\nkind: Service\nmetadata:\n  name: ${appName}\n  namespace: ${namespace}\nspec:\n  selector:\n    app: ${appName}\n  ports:\n    - port: 80\n      targetPort: 80\n  type: ClusterIP`,
    ingress: `apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: ${appName}-ingress\n  namespace: ${namespace}\nspec:\n  ingressClassName: nginx\n  rules:\n    - host: ${appName}.cloploy.app\n      http:\n        paths:\n          - path: /\n            pathType: Prefix\n            backend:\n              service:\n                name: ${appName}\n                port:\n                  number: 80`,
    hpa: `apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: ${appName}-hpa\n  namespace: ${namespace}\nspec:\n  scaleTargetRef:\n    apiVersion: apps/v1\n    kind: Deployment\n    name: ${appName}\n  minReplicas: 2\n  maxReplicas: 6\n  metrics:\n    - type: Resource\n      resource:\n        name: cpu\n        target:\n          type: Utilization\n          averageUtilization: 65`
  };
}
