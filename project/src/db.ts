import Dexie, { Table } from 'dexie';

// Define the structure of a report in the database
export interface Report {
  id?: number;
  content: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: Date;
}

// Create a Dexie database class
export class SmartTrafficDB extends Dexie {
  reports!: Table<Report>;

  constructor() {
    super('smartTrafficDB');
    this.version(1).stores({
      // The '++id' means it's an auto-incrementing primary key.
      // 'createdAt' is indexed to allow sorting reports by date.
      reports: '++id, createdAt',
    });
  }
}

// Export a single instance of the database
export const db = new SmartTrafficDB();
