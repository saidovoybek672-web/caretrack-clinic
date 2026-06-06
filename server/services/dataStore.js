const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const config = require('../config');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

let cache = null;
let writeQueue = Promise.resolve();

async function load() {
  if (cache) return cache;
  try {
    const raw = await readFile(config.dataPath, 'utf8');
    cache = JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      cache = { users: [], doctors: [], patients: [], diagnoses: [], services: [], newsletters: [], clinic: null };
      await save();
    } else {
      throw err;
    }
  }
  return cache;
}

async function save() {
  const data = cache;
  writeQueue = writeQueue.then(() =>
    writeFile(config.dataPath, JSON.stringify(data, null, 2), 'utf8')
  );
  await writeQueue;
}

async function getDb() {
  await load();
  return cache;
}

async function updateDb(mutator) {
  await load();
  mutator(cache);
  await save();
  return cache;
}

module.exports = { getDb, updateDb, load };
