import mongoose from 'mongoose';
import { DatabaseEngine } from './databaseEngine';
import { config } from '../config';

export default class MongoDbEngine implements DatabaseEngine {
  connect = async (): Promise<void> => {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.database.mongo.uri);
  };

  close = async (): Promise<void> => {
    await mongoose.connection.close();
  };

  drop = async (): Promise<void> => {
    await mongoose.connection.db.dropDatabase();
  };
}
