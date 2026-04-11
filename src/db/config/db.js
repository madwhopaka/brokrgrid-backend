import config from 'config'
import { Sequelize } from 'sequelize'
import configFile from '../../../config/dbConfig.js'
import { logger } from '../../support/logger.js'

const env = process.env.NODE_ENV || 'development'
const dbConfig = configFile[env]

if (!dbConfig) {
  throw new Error(`Database configuration for environment "${env}" was not found`)
}

let sequelize

if (dbConfig.use_env_variable) {
  const dbUrl = process.env[dbConfig.use_env_variable] || config.get('DATABASE_URL')

  if (!dbUrl) {
    throw new Error(`Database URL is not set in ${dbConfig.use_env_variable} or config`)
  }

  sequelize = new Sequelize(dbUrl, {
    dialect: dbConfig.dialect,
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
    dbConfig.database,
    dbConfig.username,
    process.env.DB_PASSWORD || dbConfig.password,
    {
      ...dbConfig,
      logging: (msg) => logger.debug(msg)
    }
  )
}

export default sequelize