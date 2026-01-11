import * as Sentry from "@sentry/nextjs";

const APP_VERSION = "0.1.0";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  debug: false,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: `state-of-clarity@${APP_VERSION}`,
  environment: process.env.NODE_ENV || "development",
  initialScope: {
    tags: {
      version: APP_VERSION,
    },
  },
});
