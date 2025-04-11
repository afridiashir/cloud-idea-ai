import { authOption } from "@/lib/auth";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg"; // Use ES6 import syntax
import { mongodbConnection, mysqlConnection } from "../connect/connection";

export async function GET(
  req: NextRequest,
) {
  
  const session = await getServerSession(authOption);

  
  const { searchParams } = new URL(req.url);
  const databaseId = parseInt(searchParams.get('database_id'));
  const tableName = searchParams.get('table_name');

  // Check if the user is authenticated
  if (!session?.user) {
    return NextResponse.json({ msg: "Authentication Error" }, { status: 401 });
  }

  try {
    // Fetch the database details from Prisma
    const database = await prisma.database.findFirstOrThrow({
      where: {
        id: +databaseId, // Convert id to a number
      },
    });

    // Handle PostgreSQL database type
    if (database.type.toLowerCase() === "postgres") {
      const client = await postgresConnection(database.connectionString);

      try {
        // Query to fetch table names from the PostgreSQL database
        const result = await client.query(`
          SELECT * FROM "${tableName}"`);

        // Close the PostgreSQL connection
        await client.end();

        // Return the table names
        return NextResponse.json(
          {
            data: result.rows, // Extract the rows from the result
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
        // Query to fetch all data from the specified MySQL table
        const [rows] = await connection.query(`
          SELECT * FROM \`${tableName}\`
        `);
    
        // Close the MySQL connection
        await connection.end();
    
        // Return the table data
        return NextResponse.json(
          {
            data: rows, // MySQL returns rows directly
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
        // Get database name from connection string
        const dbName = new URL(database.connectionString).pathname.substring(1);
        const db = client.db(dbName);
        const collection = db.collection(tableName);
    
        // Fetch all documents (equivalent to SELECT * in MySQL)
        const documents = await collection.find({}).toArray();
    
        // Convert MongoDB documents to MySQL-like rows format
        const rows = documents.map(doc => {
          const { _id, ...rest } = doc; // Remove MongoDB's _id field
          return {
            ...rest,
            id: _id.toString() // Convert ObjectId to string if you want to keep an ID
          };
        });
    
        await client.close();
    
        // Return data in same structure as MySQL
        return NextResponse.json(
          {
            data: rows, // Matches MySQL response format
          },
          { status: 200 }
        );
      } catch (mongoError) {
        await client.close().catch(e => console.error("Failed to close connection:", e));
        return NextResponse.json(
          {
            msg: "Error querying MongoDB collection",
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

// Helper function to connect to PostgreSQL
const postgresConnection = async (connectionString: string) => {
  const client = new Client({
    connectionString: connectionString,
  });

  await client.connect();
  return client;
};