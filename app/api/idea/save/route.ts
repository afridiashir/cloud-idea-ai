import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOption } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { description, name, title, architecture, prototype } = await req.json();

    // Retrieve user session
    const session = await getServerSession(authOption);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: +userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Check if an idea with the same name and title already exists for the user
    const existingIdea = await prisma.ideaHistory.findFirst({
      where: {
        user_id: +userId,
        name: name,
        title: title,
      },
    });

    if (existingIdea) {
      const updatedData: any = {};

      if (architecture) {
        updatedData.architecture = architecture;
      }

      if (prototype) {
        updatedData.prototype = prototype;
      }

      if(description){
        updatedData.description = description;
      }

      // Update only if there are changes
      if (Object.keys(updatedData).length > 0) {
        const updatedIdea = await prisma.ideaHistory.update({
          data: updatedData,
          where: {
            id: existingIdea.id, // Use primary key instead of filtering again
          },
        });

        return NextResponse.json(
          {
            message: "Data updated successfully.",
            idea: updatedIdea,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { error: "This idea already exists." },
        { status: 400 }
      );
    }

    // Create new idea
    const requestedData: any = {
      title,
      name,
      description,
      user_id: +userId,
    };

    if (architecture) {
      requestedData.architecture = architecture;
    }

    if (prototype) {
      requestedData.prototype = prototype;
    }

    const newIdea = await prisma.ideaHistory.create({
      data: requestedData,
    });

    return NextResponse.json(
      {
        message: "Data saved successfully.",
        idea: newIdea,
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
