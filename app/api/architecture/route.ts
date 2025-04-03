import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOption } from "@/lib/auth";
import axios from "axios";

export const maxDuration = 50;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const session = await getServerSession(authOption);

    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }
    const response = await axios.post(
      "https://app.eraser.io/api/render/prompt", // Replace with your API endpoint
      { "text" : text,
        "theme" : "light",
        "diagramType": "sequence-diagram",
"mode": "standard",
"returnFile": false,
"background": true,
"scale": "1"
       },
      {
        headers: { 
          "accept": "application/json",
          "content-type": "application/json",
          "authorization": "Bearer ngSvOEpJZLZrT43hEbum"          
         },
      }
    );



    return NextResponse.json(
      {
        data: {...response.data},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in saving idea:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
