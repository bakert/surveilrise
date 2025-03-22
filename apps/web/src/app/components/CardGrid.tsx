'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Card {
  id: string;
  name: string;
  imgUrl: string;
}

interface SearchResponse {
  cards: Card[];
  total: number;
}

export function CardGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, page]);

  if (!query) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (!results?.cards.length) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-white text-xl">No results found</div>
      </div>
    );
  }

  const totalPages = Math.ceil(results.total / 20);

  // Generate pagination array with ellipsis
  const getPaginationArray = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || // First page
        i === totalPages || // Last page
        (i >= page - delta && i <= page + delta) // Pages around current page
      ) {
        range.push(i);
      }
    }

    for (let i = 0; i < range.length; i++) {
      if (l) {
        if (range[i] - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (range[i] - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(range[i]);
      l = range[i];
    }

    return rangeWithDots;
  };

  return (
    <div className="space-y-8">
      {/* Results Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.cards.map((card) => (
          <div
            key={card.id}
            className="relative aspect-[2.5/3.5] cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              console.log('Clicking card:', card);
              router.push(`/card/${card.id}`);
            }}
          >
            <Image
              src={card.imgUrl}
              alt={card.name}
              fill
              className="object-contain rounded-lg"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/?q=${encodeURIComponent(query)}&page=${Math.max(1, page - 1)}`)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {getPaginationArray().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-400">...</span>
            ) : (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                onClick={() => router.push(`/?q=${encodeURIComponent(query)}&page=${pageNum}`)}
              >
                {pageNum}
              </Button>
            )
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/?q=${encodeURIComponent(query)}&page=${Math.min(totalPages, page + 1)}`)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}