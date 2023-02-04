const { createServer } = require('http');
const { stat, createReadStream, createWriteStream } = require('fs');
const { promisify } = require('util');
const fileInfo = promisify(stat);
const sequelize = require('./db.cjs');
const Song = require('./song.cjs');
const mm = require('music-metadata');
const util = require('util');
let Readable = require('stream').Readable;
sequelize.sync().then(() => console.log('db is ready'));
const port = 80;
let filepath;
// TODO:add certificates for https
function notFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`<p><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
    404<br></br>Not found
    </p><style>p { text-align:center}</style>`);
}
function bufferToStream(buffer) {
    var stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}
function streamSong(res, size) {
    res.writeHead(200, {
        'Content-Length': size,
        'Content-Type': 'audio/mpeg'
    });
    createReadStream(filepath).pipe(res);
}
function handleCover(res, metadata) {
    let picture = metadata.common.picture[0];
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    bufferToStream(picture.data).pipe(res);
}
// Handling range requests makes it not work with the app for some reason
// function handleRange(req, res, size, range) {
//     let [start, end] = range.replace(/bytes=/, '').split('-');
//     start = parseInt(start, 10);
//     end = end ? parseInt(end, 10): size-1;
//     res.writeHead(206, {
//         'Content-Range': `bytes ${start}-${end}/${size}`,
//         'Accept-Ranges': 'bytes',
//         'Content-Length': (start-end) + 1,
//         'Content-Type': 'audio/mpeg'
//     });
//     createReadStream(filepath, {start, end}).pipe(res);
// }
function handleMeta(res, metadata) {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    let string_meta = util.inspect(metadata.common, { showHidden: false, depth: null });
    res.end(string_meta);
}
function handleAll(res, metasongs) {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf8'
    });
    let string_meta = JSON.stringify(metasongs);
    res.end(string_meta);
}
createServer(async (req, res) => {
    if (req.url.split('/')[1] == 'tracks') {
        try {
            let song = await Song.findOne({ where: { id: req.url.split('/')[2] } });
            filepath = `D:\\Users\\Sergio\\Music\\Actual Music\\${song.filename}`;
            let { size } = await fileInfo(filepath);
            // let range = req.headers.range;
            streamSong(res, size);
        }
        catch (e) {
            notFound(res);
        }
    }
    else if (req.url.split('/')[1] == 'v0') {
        let id = req.url.split('/')[2];
        if (id == 'album') {
            id = req.url.split('/')[3];
            if (id == 'all') {
                let songs = await Song.findAll();
                let albums = [];
                for (let i = 0; i < songs.length; i++) {
                    filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${songs[i].filename}`;
                    let metadata = await mm.parseFile(filepath);
                    if (!albums.some(album => album.title == metadata.common.album)) {
                        let album = { title: metadata.common.album, artist: metadata.common.artist, id: i + 1 };
                        albums.push(album);
                    }
                }
                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf8'
                });
                let string_meta = JSON.stringify(albums);
                res.end(string_meta);
            }
            else if (id == 'cover') {
                let albumname = req.url.split('/')[4].replace(/%20/g, ' ');
                try {
                    let song = await Song.findOne({ where: { album: albumname } });
                    filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${song.filename}`;
                    let metadata = await mm.parseFile(filepath);
                    metadata.common.id = song.id;
                    handleCover(res, metadata);
                }
                catch (e) {
                    notFound(res);
                }
            }
            else {
                id = id.replace(/%20/g, ' ');
                let songs = await Song.findAll();
                let albumsongs = [];
                for (let i = 0; i < songs.length; i++) {
                    filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${songs[i].filename}`;
                    let metadata = await mm.parseFile(filepath);
                    if (metadata.common.album == id) {
                        albumsongs.push(songs[i]);
                    }
                }
                res.writeHead(200, {
                    'Content-Type': 'text/plain; charset=utf8'
                });
                let string_meta = JSON.stringify(albumsongs);
                res.end(string_meta);
            }
        }
        if (id == 'cover') {
            id = req.url.split('/')[3];
            try {
                let song = await Song.findOne({ where: { id: id } });
                filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${song.filename}`;
                let metadata = await mm.parseFile(filepath);
                metadata.common.id = song.id;
                handleCover(res, metadata);
            }
            catch (error) {
            }
        }
        else if (id == 'all') {
            let metasongs = [];
            let songs = await Song.findAll();
            for (let i = 0; i < songs.length; i++) {
                filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${songs[i].dataValues.filename}`;
                let metadata = await mm.parseFile(filepath);
                delete metadata.common.picture;
                metadata.common.id = songs[i].dataValues.id;
                metasongs.push(metadata.common);
            }
            handleAll(res, metasongs);
        }
        else {
            try {
                let song = await Song.findOne({ where: { id: id } });
                filepath = `D:\Users\\Sergio\\Music\\Actual Music\\${song.filename}`;
                let metadata = await mm.parseFile(filepath);
                handleMeta(res, metadata);
            }
            catch (error) {
                notFound(res);
            }
        }
    }
    else {
        notFound(res);
    }
}).listen(port, () => console.log('Running on port: ', port));
//# sourceMappingURL=main.js.map