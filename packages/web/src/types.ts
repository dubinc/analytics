export type AllowedPropertyValues = string | number | boolean | null;

export interface AnalyticsProps {
  apiKey?: string;
}

export type TrackEventProperties = {
  [key: string]: AllowedPropertyValues;
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
      track: (event: string, properties?: unknown) => void;
    };
  }
}
