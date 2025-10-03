#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection string (you'll need to set this)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quranesk:vFMrNqiDUSnuDI2h@cluster0.smzbhph.mongodb.net/';
const DB_NAME = 'quran_api';

async function migrateData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db(DB_NAME);
        
        // 1. Migrate surah info
        console.log('Migrating surah info...');
        const surahInfo = require('./data/surahinfo.json');
        await db.collection('surahs').deleteMany({}); // Clear existing
        await db.collection('surahs').insertMany(
            surahInfo.map((surah, index) => ({
                ...surah,
                _id: index,
                surahNumber: index + 1
            }))
        );
        console.log(`✅ Migrated ${surahInfo.length} surahs`);
        
        // 2. Migrate Quran text
        console.log('Migrating Quran text...');
        const quranData = require('./data/quran.ts');
        await db.collection('verses').deleteMany({}); // Clear existing
        
        const verses = [];
        quranData.forEach((surah, surahIndex) => {
            surah.forEach((verse, verseIndex) => {
                verses.push({
                    _id: `${surahIndex}-${verseIndex}`,
                    surahNumber: surahIndex + 1,
                    verseNumber: verseIndex + 1,
                    arabic: verse.words.map(w => w.arabic).join(' '),
                    uthmani: verse.words.map(w => w.uthmani).join(' '),
                    indopak: verse.words.map(w => w.indopak).join(' '),
                    words: verse.words.map(word => ({
                        arabic: word.arabic,
                        uthmani: word.uthmani,
                        indopak: word.indopak,
                        transliteration: word.transliteration,
                        english: word.english,
                        root: word.root,
                        niq: word.niq,
                        nis: word.nis
                    })),
                    meta: verse.meta
                });
            });
        });
        
        // Insert in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < verses.length; i += batchSize) {
            const batch = verses.slice(i, i + batchSize);
            await db.collection('verses').insertMany(batch);
            console.log(`Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(verses.length/batchSize)}`);
        }
        console.log(`✅ Migrated ${verses.length} verses`);
        
        // 3. Migrate translations
        console.log('Migrating translations...');
        const translationFiles = [
            'en.ahmedali.json', 'en.qarai.json', 'en.sarwar.json', 
            'en.yusufali.json', 'en.chinoy.json'
        ];
        
        await db.collection('translations').deleteMany({}); // Clear existing
        
        for (const file of translationFiles) {
            const translationData = require(`./data/translations/${file}`);
            const translationName = file.replace('.json', '');
            
            const translations = [];
            translationData.forEach((surah, surahIndex) => {
                surah.forEach((verse, verseIndex) => {
                    translations.push({
                        _id: `${translationName}-${surahIndex}-${verseIndex}`,
                        translation: translationName,
                        surahNumber: surahIndex + 1,
                        verseNumber: verseIndex + 1,
                        text: verse
                    });
                });
            });
            
            // Insert in batches
            for (let i = 0; i < translations.length; i += batchSize) {
                const batch = translations.slice(i, i + batchSize);
                await db.collection('translations').insertMany(batch);
            }
            
            console.log(`✅ Migrated ${translations.length} ${translationName} translations`);
        }
        
        // 4. Migrate tafsirs
        console.log('Migrating tafsirs...');
        await db.collection('tafsirs').deleteMany({}); // Clear existing
        
        // Puya tafsir
        const puyaData = require('./data/tafsirs/puya.json');
        const puyaTafsirs = [];
        puyaData.forEach((surah, surahIndex) => {
            surah.forEach((verse, verseIndex) => {
                puyaTafsirs.push({
                    _id: `puya-${surahIndex}-${verseIndex}`,
                    tafsir: 'puya',
                    surahNumber: surahIndex + 1,
                    verseNumber: verseIndex + 1,
                    text: verse.text,
                    link: verse.link
                });
            });
        });
        
        for (let i = 0; i < puyaTafsirs.length; i += batchSize) {
            const batch = puyaTafsirs.slice(i, i + batchSize);
            await db.collection('tafsirs').insertMany(batch);
        }
        console.log(`✅ Migrated ${puyaTafsirs.length} puya tafsirs`);
        
        // 5. Create indexes for performance
        console.log('Creating indexes...');
        await db.collection('verses').createIndex({ surahNumber: 1, verseNumber: 1 });
        await db.collection('translations').createIndex({ translation: 1, surahNumber: 1, verseNumber: 1 });
        await db.collection('tafsirs').createIndex({ tafsir: 1, surahNumber: 1, verseNumber: 1 });
        await db.collection('surahs').createIndex({ surahNumber: 1 });
        console.log('✅ Created indexes');
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('\nCollections created:');
        console.log('- surahs: Basic surah information');
        console.log('- verses: Quran text with words and metadata');
        console.log('- translations: Multiple translation texts');
        console.log('- tafsirs: Tafsir texts');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
    }
}

// Run migration
if (require.main === module) {
    migrateData().catch(console.error);
}

module.exports = { migrateData };
