import { Metadata } from "next";
import { CardGrid } from "./components/CardGrid";
import { SearchBar } from "./components/SearchBar";

export const metadata: Metadata = {
  title: "Surveilrise - Magic: The Gathering Card Search",
  description: "Search Magic: The Gathering cards with advanced filters and syntax",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white">
              Surveilrise
            </h1>
            <p className="text-xl text-gray-300">
              Advanced Magic: The Gathering card search
            </p>
          </div>

          {/* Search Interface */}
          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>

          {/* Results Grid */}
          <div className="w-full">
            <CardGrid />
          </div>
        </div>
      </main>
    </div>
  );
}
