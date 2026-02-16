import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'crow-a2a-service',
  traceExporter: new OTLPTraceExporter({
    url: 'https://api.axiom.co/v1/traces',
    headers: {
      'Authorization': `Bearer ${process.env.AXIOM_API_TOKEN}`,
      'X-Axiom-Dataset': process.env.AXIOM_DATASET || 'crow-traces',
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown().then(() => process.exit(0)));
