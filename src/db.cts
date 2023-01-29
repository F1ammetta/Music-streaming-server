const { Sequelize } = require('sequelize');

let sequelize = new Sequelize('songs', 'user', 'pass', {
    dialect: 'sqlite',
    host: './src/songs.sqlite'
});

module.exports = sequelize;