import { DatabaseEngine } from './databaseEngine';
import MongoDbEngine from './mongoDbEngine';

export class Database {
  private static instance: DatabaseEngine | null;

  public static getInstance = (): DatabaseEngine => {
    if (!Database.instance) {
      Database.instance = new MongoDbEngine();
    }

    return Database.instance;
  };
}
