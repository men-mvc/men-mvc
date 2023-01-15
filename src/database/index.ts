import { Database } from './database';
import { DatabaseEngine } from './databaseEngine';

export const database: DatabaseEngine = Database.getInstance();

export * from './database';
export * from './databaseEngine';
export * from './mongoDbEngine';
