import k8s from '@kubernetes/client-node';

async function main() {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  try {
    const res = await k8sApi.readNamespacedSecret('cloploy-secrets', 'cloploy');
    console.log('--- SECRET DATA ---');
    for (const [key, value] of Object.entries(res.body.data)) {
      const decoded = Buffer.from(value, 'base64').toString('utf-8');
      console.log(`${key}=${decoded}`);
    }
  } catch (e) {
    console.error('Error reading secret:', e.message);
  }
}
main();
