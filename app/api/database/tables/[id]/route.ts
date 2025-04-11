import { authOption } from "@/lib/auth";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg"; // Use ES6 import syntax
import { mongodbConnection, mysqlConnection, postgresConnection } from "../../connect/connection";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOption);

  // Check if the user is authenticated
  if (!session?.user) {
    return NextResponse.json({ msg: "Authentication Error" }, { status: 401 });
  }

  try {
    // Fetch the database details from Prisma
    const database = await prisma.database.findFirstOrThrow({
      where: {
        id: +params.id, // Convert id to a number
      },
    });

    // Handle PostgreSQL database type
    if (database.type.toLowerCase() === "postgres") {
      const client = await postgresConnection(database.connectionString);

      try {
        // Query to fetch table names from the PostgreSQL database
        const result = await client.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public';
        `);

        // Close the PostgreSQL connection
        await client.end();

        // Return the table names
        return NextResponse.json(
          {
            tables: result.rows, // Extract the rows from the result
          },
          { status: 200 }
        );
      } catch (pgError) {
        // Handle PostgreSQL query errors
        console.error("PostgreSQL query error:", pgError);
        await client.end(); // Ensure the connection is closed
        return NextResponse.json(
          {
            msg: "Error querying PostgreSQL database",
            error: pgError instanceof Error ? pgError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    if (database.type.toLowerCase() === "mysql") {
      const connection = await mysqlConnection(database.connectionString);
    
      try {
        // Query to fetch table names from the MySQL database
        const [rows] = await connection.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = DATABASE();
        `);
    
        // Close the MySQL connection
        await connection.end();
    
        // Return the table names
        return NextResponse.json(
          {
            tables: rows, // MySQL returns rows directly
          },
          { status: 200 }
        );
      } catch (mysqlError) {
        // Handle MySQL query errors
        console.error("MySQL query error:", mysqlError);
        await connection.end(); // Ensure the connection is closed
        return NextResponse.json(
          {
            msg: "Error querying MySQL database",
            error: mysqlError instanceof Error ? mysqlError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    if (database.type.toLowerCase() === "mongodb") {
      const client = await mongodbConnection(database.connectionString);
      
      try {
        const db = client.db();
        // Get all collections (equivalent to tables in MySQL)
        const collections = await db.listCollections().toArray();
        
        const collectionNames = collections.map(col => ({ table_name: col.name }));;
        console.log(collectionNames);
        // Close the MongoDB connection
        await client.close();
    
        // Return the collection names
        return NextResponse.json(
          {
            tables: collectionNames, // Using same "tables" key for consistency
          },
          { status: 200 }
        );
      } catch (mongoError) {
        // Handle MongoDB errors
        console.error("MongoDB query error:", mongoError);
        await client.close().catch(e => console.error("Failed to close connection:", e));
        
        return NextResponse.json(
          {
            msg: "Error querying MongoDB database",
            error: mongoError instanceof Error ? mongoError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    // Return the database details for non-PostgreSQL databases
    return NextResponse.json(
      {
        database: database,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle general errors
    console.error("Error in GET function:", error);
    return NextResponse.json(
      {
        msg: "Error fetching data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

