const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


app.post('/connect', async (req, res) => {
    const { dbUrl } = req.body;
    if (!dbUrl) {
        return res.status(400).json({ error: 'Please provide a valid MongoDB URL' });
    }
    let client;
    try {
        client = new MongoClient(dbUrl);
        await client.connect();
        const adminDb = client.db().admin();
        const dbList = await adminDb.listDatabases();
        const databasesWithCollections = {};
        for (const dbInfo of dbList.databases) {
            const dbName = dbInfo.name;
            const db = client.db(dbName);  
            try {
                const collections = await db.listCollections().toArray();
                const collectionNames = collections.map(col => col.name);
                databasesWithCollections[dbName] = collectionNames;
            } catch (err) {
                console.warn(`Cannot access collections in ${dbName}:`, err.message);
                databasesWithCollections[dbName] = [];
            }
        }
        res.json({ success: true, databases: databasesWithCollections });
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});


app.post('/query', async (req, res) => {
    const { dbUrl, dbName, collectionName, query } = req.body;
    if (!dbUrl || !dbName || !collectionName || !query) {
        return res.status(400).json({ error: 'Please provide dbUrl, dbName, collectionName, and query.' });
    }
    let client;
    try {
        client = new MongoClient(dbUrl);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        const regex = /(\w+)\((.*?)\)(?:\.(\w+)\((.*?)\))?/;
        const match = query.match(regex);
        if (!match) {
            return res.status(400).json({ error: 'Invalid query format. Use something like find({...}).limit(5).' });
        }
        const [, operation, queryData, optionOperation, optionValue] = match;
        let results;
        switch (operation) {
            case 'find': {
                let queryObject = queryData ? JSON.parse(queryData) : {};
                let cursor = collection.find(queryObject);
                if (Object.keys(queryObject).length === 0 && queryObject.constructor === Object && optionOperation !== 'limit') {
                    cursor = cursor.limit(10);
                }

                if (optionOperation === 'limit' && optionValue) {
                    cursor = cursor.limit(parseInt(optionValue));
                }

                if (optionOperation === 'sort' && optionValue) {
                    cursor = cursor.sort(JSON.parse(optionValue));
                }

                results = await cursor.toArray();
                break;
            }
            case 'updateOne': {
                const updateParams = JSON.parse(queryData);
                results = await collection.updateOne(updateParams.filter, { $set: updateParams.update });
                break;
            }
            case 'updateMany': {
                const updateParams = JSON.parse(queryData);
                results = await collection.updateMany(updateParams.filter, { $set: updateParams.update });
                break;
            }
            case 'insertOne': {
                results = await collection.insertOne(JSON.parse(queryData));
                break;
            }
            case 'deleteOne': {
                results = await collection.deleteOne(JSON.parse(queryData));
                break;
            }
            default: {
                return res.status(400).json({ error: `Unsupported operation: ${operation}` });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('Query Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});



app.post('/update', async (req, res) => {
    const { dbUrl, dbName, collectionName, operation, filter, update } = req.body;
    if (!dbUrl || !dbName || !collectionName || !operation || !filter || !update) {
        return res.status(400).json({ error: 'Please provide dbUrl, dbName, collectionName, operation, filter, and update.' });
    }
    if (filter._id) {
        filter._id = new ObjectId(filter._id);
    }
    let client;
    try {
        client = new MongoClient(dbUrl);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        let results;
        switch (operation) {
            case 'updateOne': {
                results = await collection.updateOne(filter, { $set: update });
                break;
            }
            case 'updateMany': {
                results = await collection.updateMany(filter, { $set: update });
                break;
            }
            default: {
                return res.status(400).json({ error: `Unsupported operation: ${operation}. Use 'updateOne' or 'updateMany'.` });
            }
        }
        res.json({ success: true, results });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});



app.post('/delete', async (req, res) => {
    const { dbUrl, dbName, collectionName, filter } = req.body;
    if (!dbUrl || !dbName || !collectionName || !filter) {
        return res.status(400).json({ error: 'Please provide dbUrl, dbName, collectionName, and filter.' });
    }
    if (filter._id) {
        filter._id = new ObjectId(filter._id);
    }
    let client;
    try {
        client = new MongoClient(dbUrl);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const results = await collection.deleteOne(filter);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});



app.post('/create', async (req, res) => {
    const { dbUrl, dbName, collectionName, data } = req.body;
    if (!dbUrl || !dbName || !collectionName || !data) {
        return res.status(400).json({ error: 'Please provide dbUrl, dbName, collectionName, and data.' });
    }
    let client;
    try {
        client = new MongoClient(dbUrl);
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const results = await collection.insertOne(data);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Create Error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (client) {
            await client.close();
        }
    }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
