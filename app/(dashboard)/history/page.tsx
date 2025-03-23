"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import IdeaBar from "@/components/IdeaBar";
import toast from "react-hot-toast";
import Link from "next/link";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

// Interface for card data
interface Card {
  description: string;
  title: string;
  prototype:string;
}

// InfoCard Component Props
interface InfoCardProps {
  card: Card;
}

// Page Component
const Page: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();
  const limit = 5; // Number of items per page

  // Fetch cards from the API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/idea?page=${currentPage}&limit=${limit}&search=${search}`
        );
        setCards(response.data.result || []);
        setTotalPages(response.data.pagination.totalPages || 1);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchCards();
  }, [currentPage, search]);

  // Debounce search input
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      setCurrentPage(1); // Reset to the first page when searching
    }, 1000);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1); // Reset to the first page when searching
    }
  };

  return (
    <div className="w-full pb-16  min-h-screen">
      <div className="w-full border-b px-32 py-6 flex justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            className="font-body py-6 flex gap-4 bg-background text-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft /> Back
          </Button>
          <h1 className="font-heading text-4xl font-bold">Idea History</h1>
        </div>
        <div className="w-[400px] h-40px border border-blue-600 rounded-lg flex items-center bg-background p-2 pr-4">
          <input
            className="w-full h-full bg-transparent outline-none font-body"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            type="text"
            placeholder="Search..."
          />
          <Search />
        </div>
      </div>

      <div className="px-32 py-6">
        {loading ? (
          <Skeleton className="w-full h-32 mb-4" />
        ) : (
          cards.map((card, index) => <HistoryCard key={index} card={card} />)
        )}

        {/* Pagination Controls */}
        <div className="mt-6 flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-lg font-body">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

// InfoCard Component
const HistoryCard: React.FC<InfoCardProps> = ({ card }) => {
  const [expanded, setExpanded] = useState(false);
  const maxLines = 5; // Show only 5 lines before "See More"

  // Function to parse JSON safely
  const parsePrototype = (prototype: string) => {
    try {
      return JSON.parse(prototype);
    } catch (error) {
      console.error("Invalid JSON format in prototype:", error);
      return [];
    }
  };

  const prototypeData = parsePrototype(card.prototype); // Parse safely

  const formatResponse = (response: string) => {
    return response.split("\n").map((line, index) => (
      <span key={index}>
        {line.split(/(https?:\/\/[^\s]+|\*\*[^*]+\*\*)/g).map((part, i) => {
          if (part.match(/https?:\/\/[^\s]+/)) {
            return (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {part}
              </a>
            );
          }
          if (part.match(/\*\*[^*]+\*\*/)) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
        <br />
      </span>
    ));
  };

  const formattedContent = formatResponse(card.description);
  const shouldShowSeeMore = formattedContent.length > maxLines;


  function getDomainName(link) {
    try {
      const url = new URL(link);
      return url.hostname; // Returns the domain name
    } catch (error) {
      console.error("Invalid URL:", error);
      return null;
    }
  }

  return (
    <div className="p-4 px-8 w-full border rounded-xl font-body shadow-md bg-background relative mb-4">
      <div className="flex justify-between items-start">
        <h3 className="text-md font-semibold text-blue-600 break-words">
          {card.title}
        </h3>
      </div>
      <div className="my-4">
        {expanded ? formattedContent : formattedContent.slice(0, maxLines)}

        {/* Display prototype links if they exist */}
        {expanded && (prototypeData?.length > 0 && (
          <div className="">
            <h1 className="text-lg font-bold mt-4">Prototypes:</h1>
            {prototypeData.map((item: { link: string }, index: number) => (
              <div key={index}>
                <a href={item.link} target="_blank" className="text-blue-600 mt-2 underline">{item.link}</a>
              </div>
            ))}
          </div>
        ))}
        

        {shouldShowSeeMore && !expanded && prototypeData?.length > 0  && (
          <button
            onClick={() => setExpanded(true)}
            className="text-blue-600 mt-2 inline cursor-pointer"
          >
            See More
          </button>
        )}
      </div>
    </div>
  );
};

export default Page;