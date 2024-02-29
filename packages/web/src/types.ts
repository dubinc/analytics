export type AllowedPropertyValues = string | number | boolean | null;

export interface AnalyticsProps {
  apiKey?: string;
  trackEndpoint?: string;
}

export type TrackEventProperties = Record<string, AllowedPropertyValues>;

export type SaleEventProperties = TrackEventProperties & {
  value: number;
  currency: string;
};

export interface TrackFunction {
  (eventName: string, properties?: TrackEventProperties): void;
  signUp: (properties: TrackEventProperties) => void;
  purchase: (
    properties: TrackEventProperties & { value: number; currency: string },
  ) => void;
}

declare global {
  interface Window {
    // Base interface
    da?: {
      trackClick: (properties?: TrackEventProperties) => void;
      trackConversion: (
        eventName: string,
        properties?: TrackEventProperties,
      ) => void;
    };
  }
}
