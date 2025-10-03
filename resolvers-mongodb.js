const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quranesk:vFMrNqiDUSnuDI2h@cluster0.smzbhph.mongodb.net/';
const DB_NAME = 'quran_api';

let client;
let db;

// Initialize MongoDB connection
async function initDB() {
    if (!client) {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Connected to MongoDB');
    }
    return db;
}

const surahs = async () => {
    await initDB();
    const surahs = await db.collection('surahs').find({}).toArray();
    return surahs.map(surah => ({
        ...surah,
        id: surah._id,
        verses: [] // Don't load verses for the list
    }));
};

const surah = async ({s, f, t}) => {
    await initDB();
    
    const surahInfo = await db.collection('surahs').findOne({ surahNumber: s + 1 });
    if (!surahInfo) return null;
    
    const query = { surahNumber: s + 1 };
    const verses = await db.collection('verses')
        .find(query)
        .sort({ verseNumber: 1 })
        .skip(f > -1 ? f : 0)
        .limit(t > -1 ? t - f + 1 : 10)
        .toArray();
    
    // Add translations to verses
    const versesWithTranslations = await Promise.all(
        verses.map(async (verse) => {
            const translations = await db.collection('translations')
                .find({ 
                    surahNumber: verse.surahNumber, 
                    verseNumber: verse.verseNumber 
                })
                .toArray();
            
            // Add translations to verse object
            translations.forEach(trans => {
                verse[trans.translation] = trans.text;
            });
            
            return {
                ...verse,
                id: verse._id,
                arabic: verse.arabic,
                uthmani: verse.uthmani,
                indopak: verse.indopak
            };
        })
    );
    
    return {
        ...surahInfo,
        id: surahInfo._id,
        verses: versesWithTranslations
    };
};

const verse = async ({s, v, f, t}) => {
    await initDB();
    
    const verse = await db.collection('verses').findOne({ 
        surahNumber: s + 1, 
        verseNumber: v + 1 
    });
    
    if (!verse) return null;
    
    // Get translations
    const translations = await db.collection('translations')
        .find({ 
            surahNumber: verse.surahNumber, 
            verseNumber: verse.verseNumber 
        })
        .toArray();
    
    // Add translations to verse
    translations.forEach(trans => {
        verse[trans.translation] = trans.text;
    });
    
    // Filter words if requested
    const words = verse.words.slice(
        f > -1 ? f : 0, 
        t > -1 ? t + 1 : verse.words.length
    );
    
    return {
        ...verse,
        id: verse._id,
        words: words
    };
};

const word = async ({s, v, w}) => {
    await initDB();
    
    const verse = await db.collection('verses').findOne({ 
        surahNumber: s + 1, 
        verseNumber: v + 1 
    });
    
    if (!verse || !verse.words[w]) return null;
    
    return {
        ...verse.words[w],
        surah: s + 1,
        verse: v + 1
    };
};

const page = async ({p, s}) => {
    await initDB();
    
    let query = {};
    if (p !== -1) query.page = p;
    if (s !== -1) query.surahNumber = s + 1;
    
    const verses = await db.collection('verses')
        .find(query)
        .sort({ surahNumber: 1, verseNumber: 1 })
        .toArray();
    
    // Add translations to verses
    const versesWithTranslations = await Promise.all(
        verses.map(async (verse) => {
            const translations = await db.collection('translations')
                .find({ 
                    surahNumber: verse.surahNumber, 
                    verseNumber: verse.verseNumber 
                })
                .toArray();
            
            translations.forEach(trans => {
                verse[trans.translation] = trans.text;
            });
            
            return {
                ...verse,
                id: verse._id
            };
        })
    );
    
    return versesWithTranslations;
};

const text = async ({topic}) => {
    await initDB();
    // This would need to be implemented based on your text data structure
    return "Text not implemented yet";
};

const maps = async () => {
    await initDB();
    // This would need to be implemented based on your maps data structure
    return { translationLanguages: [], audio: [], tafseers: [] };
};

const namoonaTopic = async ({link}) => {
    await initDB();
    // This would need to be implemented based on your namoonaur data structure
    return { range: [], title: "", link: "", text: "" };
};

const resolvers = {
    Query: {
        surahs(_parent, _args, _context, _info) {
            return surahs();
        },
        surah(_parent, _args, _context, _info) {
            return surah(_args);
        },
        verse(_parent, _args, _context, _info) {
            return verse(_args);
        },
        word(_parent, _args, _context, _info) {
            return word(_args);
        },
        page(_parent, _args, _context, _info) {
            return page(_args);
        },
        text(_parent, _args, _context, _info) {
            return text(_parent, _args, _context, _info);
        },
        maps(_parent, _args, _context, _info) {
            return maps();
        },
        namoonaTopic(_parent, _args, _context, _info) {
            return namoonaTopic(_args);
        }
    }
};

module.exports = resolvers;
