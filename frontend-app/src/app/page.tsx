'use client';

import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import StoreCard from '../components/StoreCard';
import { useEffect, useState } from 'react';

async function fetchStores() {
  const query = `
    query GetStores {
      stores {
        id
        name
        address
        rating
        reviewCount
        images
        services {
          price
        }
      }
    }
  `;

  // Use absolute URL to Gateway if running client-side, or relative if proxied
  // Assuming localhost:3000 is Gateway
  const res = await fetch('http://localhost:3000/graphql-store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data.stores;
}

export default function Home() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores()
      .then(data => setStores(data))
      .catch(err => console.error('Failed to fetch stores:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">

        <section className="mb-8 flex justify-center">
          <SearchBar />
        </section>

        <section className="mb-8 flex gap-8 overflow-x-auto pb-4 hide-scrollbar justify-center">
          {['Washing', 'Dry Clean', 'Ironing', 'Shoes', 'Carpets', 'Express'].map((cat, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer opacity-60 hover:opacity-100 hover:border-b-2 hover:border-black pb-2 transition">
              <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
              <span className="text-xs font-semibold">{cat}</span>
            </div>
          ))}
        </section>

        {loading ? (
          <div className="text-center py-20">Loading stores...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                address={store.address}
                rating={store.rating}
                reviewCount={store.reviewCount}
                image={store.images && store.images.length > 0 ? store.images[0] : undefined}
                // Use first service price as "priceStart" or default
                priceStart={store.services && store.services.length > 0 ? store.services[0].price : 0}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}