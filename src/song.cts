const { Model, DataTypes } = require('sequelize');
const sequelize = require('./db.cjs');

class Song extends Model {};

Song.init({
    filename: {
        type: DataTypes.STRING
    }
}, {
    sequelize: sequelize,
    modelName: 'song',
    timestamps: false
});

module.exports = Song;