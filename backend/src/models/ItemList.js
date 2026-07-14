const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemList = sequelize.define('ItemList', {
  listNo: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  listDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sealType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'none'
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = ItemList;
