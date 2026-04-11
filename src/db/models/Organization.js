// models/organization.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Organization = sequelize.define(
  "Organization",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    slug: {
      type: DataTypes.STRING,
      unique: true,
    },

    address: DataTypes.TEXT,
    city: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,

    phone_number: DataTypes.STRING,
    email: DataTypes.STRING,

    logo_url: DataTypes.TEXT,

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    members_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    created_by: {
      type: DataTypes.UUID,
    },

    plan: {
      type: DataTypes.STRING,
      defaultValue: "free",
    },

    subscription_status: {
      type: DataTypes.STRING,
      defaultValue: "active",
    },

    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "organizations",
    timestamps: true,
    paranoid: true, // enables soft delete
    underscored: true,
  }
);

export default Organization;