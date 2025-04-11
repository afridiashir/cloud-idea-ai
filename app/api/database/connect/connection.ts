

import { URL } from 'url';
import mysql from 'mysql2/promise';
import { MongoClient, MongoClientOptions } from 'mongodb';

import { Client } from "pg"; // Use ES6 import syntax
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