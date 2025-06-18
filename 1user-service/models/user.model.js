import { DataTypes } from 'sequelize';
import db from '../config/db.config.js';

const User = db.define('User', {
  // Auto-increment primary key is implied (id)
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // If you want an access column as JSON or TEXT:
  // access: {
  //   type: DataTypes.TEXT, // or DataTypes.JSON if supported
  //   allowNull: true,
  //   defaultValue: '[]'
  // }
}, {
  tableName: 'users',
  timestamps: false // or true if you have createdAt/updatedAt
});

export default User;
