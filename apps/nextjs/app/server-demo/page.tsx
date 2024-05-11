'use client';

export default function Home() {
  const trackLead = async () => {
    await fetch('/api/track/lead', {
      method: 'POST',
    });
  };

  const trackSale = async () => {
    await fetch('/api/track/sale', {
      method: 'POST',
    });
  };

  return (
    <main>
      <h1>Server Tracking Example</h1>
      <button onClick={() => trackLead()}>Track Lead</button>
      <button onClick={() => trackSale()}>Track Sale</button>
    </main>
  );
}
