import { headers } from 'next/headers';
import { EU_COUNTRY_CODES } from './constants';
import { Analytics as DubAnalytics } from '@dub/analytics/react';

export default function Analytics() {
  const countryCode = headers().get('x-vercel-ip-country') || 'US';

  if (EU_COUNTRY_CODES.includes(countryCode)) {
    return (
      <div className="fixed right-5 font-mono top-5 flex space-x-2 items-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 px-4 py-2 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:rounded-lg lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30">
        <img src={`https://flag.vercel.app/m/${countryCode}.svg`} />
        <p className="text-sm font-semibold">Dub Analytics NOT loaded</p>
      </div>
    );
  }

  return (
    <>
      <DubAnalytics />
      <div className="fixed right-5 font-mono top-5 flex space-x-2 items-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 px-4 py-2 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:rounded-lg lg:border lg:bg-gray-200 lg:dark:bg-zinc-800/30">
        <img src={`https://flag.vercel.app/m/${countryCode}.svg`} />
        <p className="text-sm font-semibold">Dub Analytics loaded</p>
      </div>
    </>
  );
}
