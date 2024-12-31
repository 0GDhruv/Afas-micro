import {DataTypes, ENUM} from 'sequelize';
import db from '../config/db.config.js';

const User = db.define('User', {
    name: {type: DataTypes.STRING,allowNull: false},
    password: {type: DataTypes.STRING, allowNull: false},
});

export default User;