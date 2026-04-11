import { Sequelize } from 'sequelize'
import configFile from '../../../config/dbConfig.js'
import UserModel from './User.js'
import { logger } from '../../support/logger.js'

const env = process.env.NODE_ENV || 'development'
const config = configFile[env]
const db = {}

let sequelize

if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable] || 'postgresql://neondb_owner:npg_2bPwyIL4KJvE@ep-late-dream-an2x7oke-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

  if (!dbUrl) {
    throw new Error(`Environment variable ${config.use_env_variable} is not set`)
  }

  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: (msg) => logger.debug(msg)
  })
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    process.env.DB_PASSWORD,
    config
  )
}

db.User = UserModel(sequelize, Sequelize.DataTypes)

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

// ✅ Exported separately — call this once at server startup
export async function initDB () {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully.')
  } catch (error) {
    logger.error('Unable to connect to the database:', error)
    process.exit(1)
  }
}

export { sequelize, Sequelize }
