import { DataTypes } from 'sequelize';
import db from '../config/db.config.js';

const User = db.define(
  'User',
  {
    // By default, Sequelize will create an "id" primary key
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // If you want to store "access" as JSON in the DB
    // access: {
    //   type: DataTypes.TEXT, // or DataTypes.JSON in some dialects
    //   allowNull: true,
    //   defaultValue: '[]' // or null
    // }
  },
  {
    tableName: 'users', // so it matches your existing table
    timestamps: false    // if you don't need createdAt/updatedAt
  }
);

export default User;
