"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ZoomIn, ZoomOut, Minus, Maximize, X } from "lucide-react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import IdeaBar from "@/components/IdeaBar";
import toast from "react-hot-toast";
import axios from "axios";
import { useIdea } from "@/components/IdeaProvider";
import { Skeleton } from "@/components/ui/skeleton";
import FormButton from "@/components/FormButton";

// Interface for the API response
interface DiagramResponse {
  imageUrl: string;
  createEraserFileUrl: string;
  diagrams: {
    diagramType: string;
    code: string;
  }[];
}
interface DiagramDummyResponse {
  imageUrl: string;
}

const Page: React.FC = () => {
  const [diagramData, setDiagramData] = useState<
    DiagramResponse | null | DiagramDummyResponse
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const { name, prototypeText, prototypeTitle } = useIdea();
  const [saveBtnLoader, setSaveBtnLoader] = useState(false);

  // Fetch diagram data from the API
  useEffect(() => {
    const fetchDiagramData = async () => {
      try {
        setLoading(true);
         const response = await axios.post("/api/architecture",{
          text: prototypeText
        });
        setDiagramData(response.data.data);

        console.log(response);
        // setDiagramData({
        //   imageUrl:
        //     "https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A24ab78b602d6a35fccf7c1529cc1fcb91f2c9b6fc1d4f580ed42e7106c9dd959.png",
        // });
        setLoading(false);
      } catch (error) {
        toast.error("Failed to fetch diagram data. Please try again.");
        setLoading(false);
      }
    };

    fetchDiagramData();
  }, [prototypeText]);

  const handleSaveIdea = (e: any) => {
    setSaveBtnLoader(true);
    axios
      .post("/api/idea/save", {
        name: name,
        title: prototypeTitle,
        description: prototypeText,
        architecture: diagramData?.imageUrl,
      })
      .then((res) => {
        toast.success(res.data.message);
        setSaveBtnLoader(false);
      })
      .catch((e) => {
        setSaveBtnLoader(false);
        toast.error(e.response.data.error);
      });
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3)); // Max zoom 3x
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5)); // Min zoom 0.5x
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  };

  return (
    <div className="w-full pb-16 min-h-screen">
      <div className="w-full border-b px-2 lg:px-32 py-6 flex justify-between items-center gap-6">
        <Button
          variant="outline"
          className="font-body  text-body py-6 flex gap-4 bg-background text-xl"
          onClick={() => router.back()}
        >
          <ArrowLeft /> Back
        </Button>
        <h1 className="font-heading text-2xl lg:text-4xl font-bold">
          MVP Architecture
        </h1>
        <FormButton
          text="Save Architecture"
          state={saveBtnLoader}
          onClick={handleSaveIdea}
          className="w-[200px] text-lg font-body hover:bg-white px-32 hover:text-blue-600 bg-blue-600 text-white"
        />
      </div>
      <div className="px-32">
        {loading ? (
          <Skeleton className="h-[800px] bg-gray-100" />
        ) : diagramData ? (
          <div className="max-w-2xl mx-auto bg-background p-4 mt-4" onClick={() => {
            setIsLightboxOpen(true);
            resetZoom();
          }}>
            <h3  className="text-xl mb-2 font-semibold text-blue-600 break-words">{prototypeTitle ? prototypeTitle : 'Idea Architecture'} </h3>
            <div className="bg-gray-200 cursor-zoom-in rounded-lg p-4 h-[400px] flex flex-col items-center padding gap-4">
              <img
                src={diagramData.imageUrl}
                alt="Architecture Diagram"
                height={400}
                className="rounded-lg shadow-lg cursor-zoom-in h-full hover:opacity-90 transition-opacity"
                onClick={() => {
                  setIsLightboxOpen(true);
                  resetZoom();
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-lg">No Architecture found.</p>
        )}
      </div>

      {/* Enhanced Lightbox Modal with Zoom Controls */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 flex gap-2 z-50 bg-black bg-opacity-50 rounded-lg p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomOut();
                }}
                className="p-2 text-white hover:bg-gray-700 rounded"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomIn();
                }}
                className="p-2 text-white hover:bg-gray-700 rounded"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn size={20} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetZoom();
                }}
                className="p-2 text-white hover:bg-gray-700 rounded"
              >
                1:1
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(false);
                }}
                className="p-2 text-white hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Image with zoom and pan capabilities */}
            <div
              className="overflow-scroll max-w-full max-h-[90vh]"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={diagramData?.imageUrl}
                alt="Architecture Diagram Fullscreen"
                className="origin-center transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-out'
                }}
              />
            </div>

            {/* Zoom level indicator */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">
              {Math.round(zoomLevel * 100)}%
            </div>

            {/* Help text */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
              {zoomLevel > 1 ? 'Drag to pan | Scroll to zoom' : 'Click to close | Scroll to zoom'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;