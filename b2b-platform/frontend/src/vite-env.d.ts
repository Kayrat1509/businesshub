/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_ENABLE_HOT_RELOAD: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_DEV_TOOLS: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_IMAGE_TYPES: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_COMPANY_WEBSITE: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}