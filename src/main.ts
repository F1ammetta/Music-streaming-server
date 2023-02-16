var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var path = require('path');
var mm = require('music-metadata');
var util = require('util');
var { createReadStream, stat } = require('fs');
var { promisify } = require('util');
var fileInfo = promisify(stat);
const Song = require('./song.cjs');
const sequelize = require('./db.cjs');
var { createServer } = require('http');
let Readable = require('stream').Readable; 

sequelize.sync().then(() => console.log('db is ready'));
const port: number = 443;
let folder: String = 'D:\\Users\\Sergio\\Music\\Actual Music\\'
// '/home/sergiodkpo/Music/';
let filepath: String;

var options = {
    key: fs.readFileSync('C:\\Certbot\\live\\kwak.sytes.net\\privkey.pem'),
    cert: fs.readFileSync('C:\\Certbot\\live\\kwak.sytes.net\\fullchain.pem'),
};

function notFound(res) {
    res.writeHead(404, {'Content-Type': 'text/html'});
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
    let string_meta: String = util.inspect(metadata.common, { showHidden: false, depth: null });
    res.end(string_meta);
}

function handleAll(res, metasongs) {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf8'
    });
    let string_meta: String = JSON.stringify(metasongs);
    res.end(string_meta);
}

app.get('/app', (req, res) => {
    const stream = createReadStream('C:\\Users\\Sergio\\flutter\\soncore\\build\\app\\outputs\\flutter-apk\\app-debug.apk');
    res.writeHead(200, {'Content-Type': 'application/vnd.android.package-archive'});
    stream.pipe(res);
})

app.get('/tracks/:id', async (req, res) => {
    try {
        let song = await Song.findOne({where: {id: req.params.id}})
        filepath = `${folder}${song.filename}`;
        let {size} = await fileInfo(filepath); // let range = req.headers.range;
        streamSong(res, size);
    }
    catch(e) {
        notFound(res);
    }
});

app.get('/v0/album/all', async (req, res) => {
    let songs = await Song.findAll();
    let albums = [];
    for (let i = 0; i < songs.length; i++) {
        try {
            filepath = `${folder}${songs[i].filename}`;
            let metadata = await mm.parseFile(filepath);
            if (!albums.some(album => album.title == metadata.common.album)) {
                let album = {title: metadata.common.album, artist: metadata.common.artist, id: i+1};
                albums.push(album);
            }
        } catch (e){
            notFound(res);
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf8'
    });
    let string_meta: String = JSON.stringify(albums);
    res.end(string_meta);
});

app.get('/v0/album/:id', async (req, res) => {
    let id = req.params.id;
    let song = await Song.findOne({where: {id: id}});
    let songs = await Song.findAll({where: {album: song.album}});
    let albumsongs = [];
    for (let i = 0; i < songs.length; i++) {
        try {
            filepath = `${folder}${songs[i].filename}`;
            let metadata = await mm.parseFile(filepath);
            metadata.common.id = songs[i].id;
            metadata.common.duration = metadata.format.duration;
            delete metadata.common.picture;
            albumsongs.push(metadata.common);
        } catch (e) {
            notFound(res);
        }
    }

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf8'
    });
    let album = {
        title: albumsongs[0].album,
        songs: albumsongs
    }
    let string_meta: String = JSON.stringify(album);
    res.end(string_meta);
});


app.get('/v0/cover/:id', async (req, res) => {
    let id = req.params.id;
    try {
        let song = await Song.findOne({where: {id: id}});
        filepath = `${folder}${song.filename}`;
        let metadata = await mm.parseFile(filepath);
        metadata.common.id = song.id;
        handleCover(res, metadata);
    }
    catch (error) {

    }
});

app.get('/v0/all', async (req, res) => {
    let metasongs = [];
    let songs = await Song.findAll();
    
    for (let i = 0; i < songs.length; i++) {
        try{
            filepath = `${folder}${songs[i].dataValues.filename}`;
            let metadata = await mm.parseFile(filepath);
            delete metadata.common.picture;
            metadata.common.duration = metadata.format.duration;
            metadata.common.id = songs[i].dataValues.id;
            metasongs.push(metadata.common);
        } catch (e) {
            notFound(res);
        }
    }
    
    handleAll(res, metasongs);
    
});

app.get('/v0/meta/:id', async (req, res) => {
    try {
        let song = await Song.findOne({where: {id: req.params.id}});
        filepath = `${folder}${song.filename}`;
        let metadata = await mm.parseFile(filepath);
        handleMeta(res, metadata);
    }
    catch (error) {
        notFound(res);   
    }
});

https.createServer(options, app).listen(port, () => console.log('Running on port: ', port));
    
var http = express();

http.get('*', function(req, res) {
    res.redirect('https://' + req.headers.host + req.url);
});

http.listen(80, () => console.log('Running on port: ', 80));