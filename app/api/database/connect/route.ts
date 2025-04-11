import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOption } from "@/lib/auth";
import { URL } from 'url';
import mysql from 'mysql2/promise';
import { MongoClient, MongoClientOptions } from 'mongodb';

import { Client } from "pg"; // Use ES6 import syntax

export async function POST(req: NextRequest) {
  try {
    const { dbType, description, connectionString } = await req.json();

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
    

    if (dbType.toLowerCase() === "postgres") {
          const client = await postgresConnection(connectionString);
    
          try {
            // Query to fetch table names from the PostgreSQL database
            const result = await client.query(`
              SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public';
            `);
    
            // Close the PostgreSQL connection
            await client.end();

             await prisma.database.create({
                data:{
                    type : dbType.toLowerCase(),
                    description: description,
                    connectionString:connectionString,
                    user_id: +userId
                }
              });

    
            // Return the table names
            return NextResponse.json(
              {
                msg: "Database Connected Successfully."// Extract the rows from the result
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

    // Check if an idea with the same name and title already exists for the user
    
    if (dbType.toLowerCase() === "mysql") {
      const connection = await mysqlConnection(connectionString);
      
      try {
        // Query to fetch table names from the MySQL database
        const [rows] = await connection.query(`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = DATABASE();
        `);
    
        // Close the MySQL connection
        await connection.end();
    
        await prisma.database.create({
          data: {
            type: dbType.toLowerCase(),
            description: description,
            connectionString: connectionString,
            user_id: +userId
          }
        });
    
        // Return the table names
        return NextResponse.json(
          {
            msg: "Database Connected Successfully.",
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

    if (dbType.toLowerCase() === "mongodb") {
      try {
        // Connect to MongoDB
        const client = await mongodbConnection(connectionString);
        const db = client.db(); // Gets the database from connection string
        
        // Verify connection by listing collections (similar to listing tables in SQL)
        const collections = await db.listCollections().toArray();
        
        // Close the connection after verification
        await client.close();
    
        // Store connection info in Prisma (same structure as MySQL version)
        await prisma.database.create({
          data: {
            type: dbType.toLowerCase(),
            description: description,
            connectionString: connectionString,
            user_id: +userId
          }
        });
    
        return NextResponse.json(
          {
            msg: "Database Connected Successfully.",
          },
          { status: 200 }
        );
      } catch (mongoError) {
        console.error("MongoDB connection error:", mongoError);
        return NextResponse.json(
          {
            msg: "Error connecting to MongoDB",
            error: mongoError instanceof Error ? mongoError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }


    return NextResponse.json(
      {
        message: "No DBType Selected.",
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



// Helper function to connect to PostgreSQL
export const postgresConnection = async (connectionString: string) => {
  const client = new Client({
    connectionString: connectionString,
  });

  await client.connect();
  return client;
};

export const mysqlConnection = async (connectionString: string) => {
  // Parse the connection string
  const parsedUrl = new URL(connectionString);
  
  const connection = await mysql.createConnection({
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port || '3306'),
    user: parsedUrl.username,
    password: parsedUrl.password,
    database: parsedUrl.pathname.slice(1), // Remove the leading '/'
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined
  });
  
  return connection;
};

export const mongodbConnection = async (connectionString: string) => {
  const client = new MongoClient(connectionString, {
    connectTimeoutMS: 5000, // 5 seconds timeout
    serverSelectionTimeoutMS: 5000, // 5 seconds to select server
    socketTimeoutMS: 30000, // 30 seconds socket timeout
  } as MongoClientOptions);

  try {
    await client.connect();
    // Verify connection immediately
    await client.db().command({ ping: 1 });
    return client;
  } catch (error) {
    await client.close(); // Clean up if connection fails
    throw error;
  }
};