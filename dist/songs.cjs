"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('./db.cjs');
class Song extends Model {
}
;
Song.init({
    filename: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'song',
    timestamps: false
});
module.exports = Song;
//# sourceMappingURL=songs.cjs.map