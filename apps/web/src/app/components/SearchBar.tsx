"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function SearchBar(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSearch} className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, or try type:dragon"
          className="w-full pr-16 text-2xl py-8 rounded-xl"
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-3 top-1/2 -translate-y-1/2 h-14 w-14"
        >
          <Search className="h-8 w-8" />
        </Button>
      </form>

      {!searchParams.get("q") && (
        <div className="text-gray-400 text-sm space-y-1 mt-24 px-8 md:px-16 lg:px-24">
          <h3 className="text-gray-300 font-semibold mb-2 text-center">
            Advanced Search
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
            <p>cmc&gt;=3 type:creature</p>
            <p>oracle:&quot;draw a card&quot; color:u</p>
            <p>-type:creature format:modern</p>
            <p>f:commander o:&quot;whenever you gain life&quot;</p>
            <p>t:land artist:&quot;john avon&quot;</p>
            <p>(t:dragon OR t:angel) color:b</p>
          </div>
        </div>
      )}
    </div>
  );
}
