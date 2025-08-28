import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

const DB_NAME = 'sfa_app.db';
const DB_VERSION = '1.0';
const DB_DISPLAYNAME = 'SFA App Local Database';
const DB_SIZE = 200000;

export const openDatabase = async () => {
  console.log('Opening local SQLite database...');
  const db = await SQLite.openDatabase({
    name: DB_NAME,
    location: 'default',
    createFromLocation: 0,
  });
  console.log('Database opened:', db);
  return db;
};

export const createTables = async (db: SQLite.SQLiteDatabase) => {
  console.log('Creating tables if not exist...');
  // Products Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      itemCode TEXT,
      description TEXT,
      price REAL,
      qty INTEGER,
      uom TEXT,
      imageUrl TEXT,
      discountPercentage REAL,
      discountAmount REAL,
      category TEXT,
      subCategory TEXT
    );
  `);

  // Dashboard Table (example: store summary stats as JSON)
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS dashboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      updatedAt TEXT
    );
  `);
  console.log('Tables created or already exist.');
};

export const initLocalDb = async () => {
  console.log('Initializing local DB...');
  const db = await openDatabase();
  await createTables(db);
  console.log('Local DB initialized.');
  return db;
}; 