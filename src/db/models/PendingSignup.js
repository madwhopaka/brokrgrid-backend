import { DataTypes } from 'sequelize'
import sequelize from '../config/db.js'

const PendingSignup = sequelize.define(
  'PendingSignup',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },

    full_name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    organization_name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    otp_hash: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },

    otp_attempt_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    resend_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },

    last_otp_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },

    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },

    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: 'pending_signups',
    timestamps: true,
    underscored: true,
    paranoid: false
  }
)

export default PendingSignup