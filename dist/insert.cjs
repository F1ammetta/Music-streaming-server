"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize = require('./db.cjs');
const Song = require('./song.cjs');
const fs = require('fs');
const mm = require('music-metadata');
sequelize.sync().then(() => console.log('db is ready'));
let count = 0;
async function get_paths() {
    try {
        let files = await fs.promises.readdir('D:\Users\\Sergio\\Music\\Actual Music');
        for (let file of files) {
            if (file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.m4a'))
                count += 1;
            else
                continue;
            console.log(file);
            let metadata = await mm.parseFile(`D:\Users\\Sergio\\Music\\Actual Music\\${file}`);
            Song.create({ id: count, filename: file, album: metadata.common.album }).then(() => console.log('inserted'));
        }
    }
    catch (e) {
        console.log(e);
    }
}
get_paths().then(() => console.log(`Done..${count}`));
//# sourceMappingURL=insert.cjs.map