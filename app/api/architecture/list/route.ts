import { authOption } from "@/lib/auth";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    const session = await getServerSession(authOption);

    if (!session?.user) {
        return NextResponse.json({ msg: 'Authentication Error' }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10); // Default to page 1
    const limit = parseInt(searchParams.get('limit') || '10', 10); // Default to 10 items per page
    const search = searchParams.get('search') || ''; // Get the search term

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    try {
        // Fetch paginated data with search filter
        const ideas = await prisma.ideaHistory.findMany({
            where: {
                user_id: +session.user.id,
                architecture:{
                    not : ""
                },
                OR: [
                    {
                        title: {
                            contains: search, // Search in the title
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    {
                        description: {
                            contains: search, // Search in the description
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                ],
            },
            orderBy: {
                created_at: 'desc', // Sort by the `createdAt` field in descending order
            },
            skip: offset,
            take: limit,
        });

        // Fetch total count of records with search filter
        const totalRecords = await prisma.ideaHistory.count({
            where: {
                user_id: +session.user.id,
                OR: [
                    {
                        title: {
                            contains: search, // Search in the title
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                    {
                        description: {
                            contains: search, // Search in the description
                            mode: 'insensitive', // Case-insensitive search
                        },
                    },
                ],
            },
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalRecords / limit);

        return NextResponse.json({
            result: ideas,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
                limit,
            },
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ msg: 'Error fetching data', error: error.message }, { status: 500 });
    }
}