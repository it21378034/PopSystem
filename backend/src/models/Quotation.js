const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quotation = sequelize.define('Quotation', {
  quotNo: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  quotDate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  validUntil: {
    type: DataTypes.STRING,
    allowNull: true
  },
  projectName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  siteLocation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  startDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  materials: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  labours: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  extras: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  discount: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '0'
  },
  paymentTerms: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  },
  tcLines: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  materialTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  labourTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  extraTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  discountAmt: {
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
  }
}, {
  timestamps: true
});

module.exports = Quotation;
