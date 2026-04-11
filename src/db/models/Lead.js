// models/lead.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phone: DataTypes.STRING,
    email: DataTypes.STRING,

    source: DataTypes.STRING,

    requirements: DataTypes.TEXT,

    min_budget: DataTypes.DECIMAL,
    max_budget: DataTypes.DECIMAL,

    status: {
      type: DataTypes.ENUM(
        "new",
        "contacted",
        "qualified",
        "site_visit",
        "negotiation",
        "closed",
        "lost"
      ),
      defaultValue: "new",
    },

    assigned_to: DataTypes.UUID,
    added_by: DataTypes.UUID,

    last_contacted_at: DataTypes.DATE,
    next_follow_up_at: DataTypes.DATE,

    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "leads",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      { fields: ["organization_id"] },
      { fields: ["assigned_to"] },
      { fields: ["status"] },
    ],
  }
);

export default Lead;