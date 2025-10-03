const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quranesk:vFMrNqiDUSnuDI2h@cluster0.smzbhph.mongodb.net/';
const DB_NAME = 'quran_api';

let client;
let db;

// Helper function to get requested fields from GraphQL query
function getRequestedFields(info) {
    if (!info || !info.fieldNodes || !info.fieldNodes[0] || !info.fieldNodes[0].selectionSet) {
        return { hasTranslations: false, hasTafsirs: false };
    }
    
    const selectionSet = info.fieldNodes[0].selectionSet;
    const selections = selectionSet.selections;
    const fieldNames = selections.map(sel => sel.name.value);
    
    // Check if any translation fields are requested
    const translationFields = ['enahmedali', 'enqarai', 'ensarwar', 'enyusufali', 'enchinoy', 
        'trgolpinarli', 'urahmedali', 'urjawadi', 'urnajafi', 'ursafdar', 'azmammadaliyev', 
        'azmehdiyev', 'deaburida', 'ruzeynalov', 'tjayati', 'fagharaati', 'faansarian', 
        'famakarem', 'faghomshei', 'fafoolavand', 'frfakhri', 'hijawadi', 'famoezzi', 
        'faayati', 'fakhorramshahi', 'fasadeqi', 'fabahrampour', 'famojtabavi', 'escortes'];
    
    // Check if any tafsir fields are requested
    const tafsirFields = ['puyaen', 'chinoyen', 'namoonaur', 'khorramdelfa'];
    
    const hasTranslations = translationFields.some(field => fieldNames.includes(field));
    const hasTafsirs = tafsirFields.some(field => fieldNames.includes(field));
    
    return { hasTranslations, hasTafsirs };
}

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

const surah = async ({s, f, t}, _parent, _context, info) => {
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

const verse = async ({s, v, f, t}, _parent, _context, info) => {
    await initDB();
    
    const verse = await db.collection('verses').findOne({ 
        surahNumber: s + 1, 
        verseNumber: v + 1 
    });
    
    if (!verse) return null;
    
    // Get requested fields from GraphQL query
    const requestedFields = getRequestedFields(info);
    
    // Only load translations if they're requested
    let translations = [];
    if (requestedFields.hasTranslations) {
        translations = await db.collection('translations')
            .find({ 
                surahNumber: verse.surahNumber, 
                verseNumber: verse.verseNumber 
            })
            .toArray();
    }
    
    // Add translations to verse (map DB keys to schema field names)
    const translationMap = {
        'en.ahmedali': 'enahmedali',
        'en.qarai': 'enqarai', 
        'en.sarwar': 'ensarwar',
        'en.yusufali': 'enyusufali',
        'en.chinoy': 'enchinoy',
        'tr.golpinarli': 'trgolpinarli',
        'ur.ahmedali': 'urahmedali',
        'ur.jawadi': 'urjawadi',
        'ur.najafi': 'urnajafi',
        'ur.safdar': 'ursafdar',
        'az.mammadaliyev': 'azmammadaliyev',
        'az.mehdiyev': 'azmehdiyev',
        'de.aburida': 'deaburida',
        'ru.zeynalov': 'ruzeynalov',
        'tj.ayati': 'tjayati',
        'fa.gharaati': 'fagharaati',
        'fa.ansarian': 'faansarian',
        'fa.makarem': 'famakarem',
        'fa.ghomshei': 'faghomshei',
        'fa.foolavand': 'fafoolavand',
        'fr.fakhri': 'frfakhri',
        'hi.jawadi': 'hijawadi',
        'fa.moezzi': 'famoezzi',
        'fa.ayati': 'faayati',
        'fa.khorramshahi': 'fakhorramshahi',
        'fa.sadeqi': 'fasadeqi',
        'fa.bahrampour': 'fabahrampour',
        'fa.mojtabavi': 'famojtabavi',
        'es.escortes': 'escortes'
    };
    
    translations.forEach(trans => {
        const fieldName = translationMap[trans.translation] || trans.translation;
        verse[fieldName] = trans.text;
    });
    
    // Set default values for missing translations to avoid null errors
    const requiredTranslations = ['enahmedali', 'enqarai', 'ensarwar', 'enyusufali', 'enchinoy', 
        'trgolpinarli', 'urahmedali', 'urjawadi', 'urnajafi', 'ursafdar', 'azmammadaliyev', 
        'azmehdiyev', 'deaburida', 'ruzeynalov', 'tjayati', 'fagharaati', 'faansarian', 
        'famakarem', 'faghomshei', 'fafoolavand', 'frfakhri', 'hijawadi', 'famoezzi', 
        'faayati', 'fakhorramshahi', 'fasadeqi', 'fabahrampour', 'famojtabavi', 'escortes'];
    
    requiredTranslations.forEach(trans => {
        if (!verse[trans]) {
            verse[trans] = 'Translation not available';
        }
    });
    
    // Add tafsir fields only if requested
    if (requestedFields.hasTafsirs) {
        const puyaTafsir = await db.collection('tafsirs').findOne({ 
            tafsir: 'puya', 
            surahNumber: verse.surahNumber, 
            verseNumber: verse.verseNumber 
        });
        
        verse.puyaen = puyaTafsir ? [`${s}-${v}-${v}`, puyaTafsir.text] : ['', 'Tafsir not available'];
        verse.chinoyen = ['', 'Tafsir not available']; // Not migrated yet
        verse.namoonaur = []; // Not migrated yet
        verse.khorramdelfa = 'Tafsir removed.';
    } else {
        // Set minimal defaults for non-nullable fields
        verse.puyaen = ['', ''];
        verse.chinoyen = ['', ''];
        verse.namoonaur = [];
        verse.khorramdelfa = '';
    }
    
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

const page = async ({p, s}, _parent, _context, info) => {
    await initDB();
    
    let verses;
    
    if (p === -1 && s !== -1) {
        // Get surah start page
        const surahInfo = await db.collection('surahs').findOne({ _id: s });
        if (!surahInfo) return [];
        
        verses = await db.collection('verses')
            .find({ 
                surahNumber: s + 1, 
                'meta.page': surahInfo.startPage 
            })
            .sort({ verseNumber: 1 })
            .toArray();
    } else if (s === -1 && p !== -1) {
        // Get all verses on page p
        verses = await db.collection('verses')
            .find({ 'meta.page': p })
            .sort({ surahNumber: 1, verseNumber: 1 })
            .toArray();
    } else {
        // Get verses on page p in surah s
        verses = await db.collection('verses')
            .find({ 
                'meta.page': p, 
                surahNumber: s + 1 
            })
            .sort({ verseNumber: 1 })
            .toArray();
    }
    
    // Get requested fields from GraphQL query
    const requestedFields = getRequestedFields(info);
    
    // Add translations to verses only if requested
    const versesWithTranslations = await Promise.all(
        verses.map(async (verse) => {
            if (requestedFields.hasTranslations) {
                const translations = await db.collection('translations')
                    .find({ 
                        surahNumber: verse.surahNumber, 
                        verseNumber: verse.verseNumber 
                    })
                    .toArray();
                
                // Map translations
                const translationMap = {
                    'en.ahmedali': 'enahmedali', 'en.qarai': 'enqarai', 'en.sarwar': 'ensarwar',
                    'en.yusufali': 'enyusufali', 'en.chinoy': 'enchinoy', 'tr.golpinarli': 'trgolpinarli',
                    'ur.ahmedali': 'urahmedali', 'ur.jawadi': 'urjawadi', 'ur.najafi': 'urnajafi',
                    'ur.safdar': 'ursafdar', 'az.mammadaliyev': 'azmammadaliyev', 'az.mehdiyev': 'azmehdiyev',
                    'de.aburida': 'deaburida', 'ru.zeynalov': 'ruzeynalov', 'tj.ayati': 'tjayati',
                    'fa.gharaati': 'fagharaati', 'fa.ansarian': 'faansarian', 'fa.makarem': 'famakarem',
                    'fa.ghomshei': 'faghomshei', 'fa.foolavand': 'fafoolavand', 'fr.fakhri': 'frfakhri',
                    'hi.jawadi': 'hijawadi', 'fa.moezzi': 'famoezzi', 'fa.ayati': 'faayati',
                    'fa.khorramshahi': 'fakhorramshahi', 'fa.sadeqi': 'fasadeqi', 'fa.bahrampour': 'fabahrampour',
                    'fa.mojtabavi': 'famojtabavi', 'es.escortes': 'escortes'
                };
                
                translations.forEach(trans => {
                    const fieldName = translationMap[trans.translation] || trans.translation;
                    verse[fieldName] = trans.text;
                });
                
                // Set defaults for missing translations
                const requiredTranslations = ['enahmedali', 'enqarai', 'ensarwar', 'enyusufali', 'enchinoy'];
                requiredTranslations.forEach(trans => {
                    if (!verse[trans]) verse[trans] = 'Translation not available';
                });
            }
            
            // Set minimal tafsir defaults
            verse.puyaen = ['', ''];
            verse.chinoyen = ['', ''];
            verse.namoonaur = [];
            verse.khorramdelfa = '';
            
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
            return surah(_args, _parent, _context, _info);
        },
        verse(_parent, _args, _context, _info) {
            return verse(_args, _parent, _context, _info);
        },
        word(_parent, _args, _context, _info) {
            return word(_args);
        },
        page(_parent, _args, _context, _info) {
            return page(_args, _parent, _context, _info);
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
