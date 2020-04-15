
    module.exports = {
    development: {
      host:"localhost",
      username: "root",
      password: process.env.SEQUELIZE_PASSWORD,
      database: "movie_dinner",
      dialect: "mysql"
    },
    test: {
      host:"localhost",
      username: "root",
      password: process.env.SEQUELIZE_PASSWORD,
      database: "movie_dinner_test",
      dialect: "mysql",
    },
     
    production: {
      'use_env_variable': 'JAWSDB_URL',
      dialect: "mysql"
    }
  };
