// models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define(
  "User",
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

    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },

    phone: DataTypes.STRING,

    address: DataTypes.TEXT,

    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    first_login: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    password: {
      type: DataTypes.TEXT,
      field: "password_hash",
    },

    last_login_at: DataTypes.DATE,

    invited_by: {
      type: DataTypes.UUID,
    },

    invite_token: DataTypes.TEXT,

    profile_image_url: DataTypes.TEXT,

    deleted_at: DataTypes.DATE,
  },
  {
    tableName: "users",
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["email", "organization_id"],
      },
      {
        unique: true,
        fields: ["phone", "organization_id"],
      },
    ],
  }
);

export default User;