export {};
declare global {
  interface Window {
    APP_SETTINGS: Record<string, any>;
    __FEATURE_FLAGS__: Record<string, boolean>;
    LSF_CONFIG: Record<any, any>;
    LabelStudio: any;
    Htx: any;
  }
}
