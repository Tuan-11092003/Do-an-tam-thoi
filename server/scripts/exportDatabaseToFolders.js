const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function exportCollection(db, dbName, collectionName, outputRoot) {
    const collection = db.collection(collectionName);
    const documents = await collection.find({}).toArray();
    const count = await collection.countDocuments();

    const collectionDir = path.join(outputRoot, dbName, collectionName);
    await ensureDir(collectionDir);

    await fs.writeFile(
        path.join(collectionDir, 'data.json'),
        JSON.stringify(documents, null, 2),
        'utf8'
    );

    await fs.writeFile(
        path.join(collectionDir, 'metadata.json'),
        JSON.stringify(
            {
                database: dbName,
                collection: collectionName,
                count,
                exportedAt: new Date().toISOString(),
            },
            null,
            2
        ),
        'utf8'
    );

    console.log(`Exported ${collectionName}: ${count} documents`);
}

async function run() {
    const uri = process.env.CONNECT_DB;

    if (!uri) {
        throw new Error('Missing CONNECT_DB in environment variables.');
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    const outputRoot = path.resolve(__dirname, '../../database');
    await ensureDir(outputRoot);

    const collections = await db.listCollections({}, { nameOnly: true }).toArray();

    for (const item of collections) {
        await exportCollection(db, dbName, item.name, outputRoot);
    }

    console.log(`\nDone. Data exported to: ${path.join(outputRoot, dbName)}`);
}

run()
    .catch((error) => {
        console.error('Export failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
