"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize = require('./db.cjs');
const Song = require('./song.cjs');
const fs = require('fs');
// sequelize.sync().then(() => console.log('db'));
let count = 0;
async function get_paths() {
    try {
        let files = await fs.promises.readdir('D:\Users\\Sergio\\Music\\Actual Music');
        for (let file of files) {
            // Song.create({filename: file}).then(() => console.log('inserted'));
            if (file.endsWith('.mp3') || file.endsWith('.flac') || file.endsWith('.m4a'))
                count += 1;
            else
                console.log(file);
        }
    }
    catch (e) {
        console.log(e);
    }
}
get_paths().then(() => console.log(`Done..${count}`));
//# sourceMappingURL=insert.cjs.map