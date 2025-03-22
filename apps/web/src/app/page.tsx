import { Metadata } from "next";
import { CardGrid } from "./components/CardGrid";
import { SearchBar } from "./components/SearchBar";

export const metadata: Metadata = {
  title: "Surveilrise - Magic: The Gathering Card Search",
  description:
    "Search Magic: The Gathering cards with advanced filters and syntax",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-white">Surveilrise</h1>
            <p className="text-2xl text-gray-300">
              <span className="font-bold">Surveilrise</span> is a{" "}
              <span className="font-bold">Magic: The Gathering</span> card
              search that does its best.
            </p>
          </div>

          <div className="w-full max-w-3xl">
            <SearchBar />
          </div>

          <div className="w-full">
            <CardGrid />
          </div>
        </div>
      </main>
    </div>
  );
}
