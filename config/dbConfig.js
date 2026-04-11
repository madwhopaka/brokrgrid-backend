const config = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    operatorsAliases: 0
  },
  test: {
    username: 'root',
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: 0
  },
  production: {
    username: 'root',
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'postgres',
    operatorsAliases: 0
  }
}

export default config
