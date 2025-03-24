import { inject } from './inject';
import type { AnalyticsProps } from './types';
import { trackClick } from './track-click';

export { inject, trackClick };
export type { AnalyticsProps };

// eslint-disable-next-line import/no-default-export -- Default export is intentional
export default {
  inject,
  trackClick,
};
