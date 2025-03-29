"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ZoomIn, ZoomOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface Card {
  description: string;
  title: string;
  architecture: string;
}

interface InfoCardProps {
  card: Card;
  onImageClick: (imageUrl: string) => void;
}

const Page: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const router = useRouter();
  const limit = 8;

  // Fetch cards from the API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/architecture/list?page=${currentPage}&limit=${limit}&search=${search}`
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
      setCurrentPage(1);
    }, 1000);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="w-full pb-16 min-h-screen">
      {/* Header Section */}
      <div className="w-full border-b px-4 lg:px-32 py-6 flex flex-col lg:flex-row justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            className="font-body  text-body py-6 flex gap-4 bg-background text-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft /> Back
          </Button>
          <h1 className="font-heading text-4xl font-bold">Architectures & Diagrams</h1>
        </div>
        <div className="w-[400px] h-10 border border-blue-600 rounded-lg flex items-center bg-background p-2 pr-4">
          <input
            className="w-full h-full bg-transparent outline-none font-body"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search..."
          />
          <Search />
        </div>
      </div>

      {/* Grid Layout for Cards */}
      <div className="px-4 lg:px-32 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-[400px]" />
            ))
          : cards.map((card, index) => (
              <HistoryCard 
                key={index} 
                card={card} 
                onImageClick={(imageUrl) => {
                  // Open custom lightbox with this image
                  const event = new CustomEvent('openLightbox', { detail: imageUrl });
                  window.dispatchEvent(event);
                }}
              />
            ))}
      </div>

      {/* Empty state */}
      {!loading && cards.length === 0 && (
        <div className="col-span-full text-center py-10 text-gray-500">
          No architectures found matching your search
        </div>
      )}

      {/* Pagination Controls */}
      {cards.length > 0 && (
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
      )}

      {/* Custom Lightbox Component - Rendered once at root level */}
      <CustomLightbox />
    </div>
  );
};

const HistoryCard: React.FC<InfoCardProps> = ({ card, onImageClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="p-4 w-full flex flex-col justify-between border rounded-xl font-body shadow-md bg-background hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-blue-600 break-words">{card.title}</h3>
      <div 
        className="my-4 bg-gray-100 h-[400px] p-2 relative w-full flex justify-center items-center cursor-pointer rounded-lg"
        onClick={() => onImageClick(card.architecture)}
      >
        {!imageLoaded && <Skeleton className="w-full h-full" />}
        <img
          src={card.architecture}
          alt={card.title}
          className={`rounded-lg shadow-md object-contain max-h-full w-auto m-2 ${imageLoaded ? 'block' : 'hidden'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
      
    </div>
  );
};

const CustomLightbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setImageUrl(customEvent.detail);
      setIsOpen(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('openLightbox', handleOpen);
    return () => window.removeEventListener('openLightbox', handleOpen);
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setStartPos({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="relative w-full h-full flex items-center justify-center"
        ref={containerRef}
      >
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button 
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            title="Reset Zoom"
          >
            1:1
          </button>
          <button 
            className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div 
          className="overflow-x-auto w-full max-h-[90vh]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Enlarged view"
            className="origin-center transition-transform duration-200 w-full"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transition: isDragging ? 'none' : 'transform 0.2s ease'
            }}
          />
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
          {`Zoom: ${Math.round(scale * 100)}%`} • Click outside to close
        </div>
      </div>
    </div>
  );
};

export default Page;