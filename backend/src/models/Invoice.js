const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  invoiceNo: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  invoiceDate: {
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
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  grandTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  showTotals: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Invoice;
