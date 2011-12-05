exports.get_env = function () {
  if(process.argv.length == 3)
    env = process.argv[(4 - 2)] // WTF.
  else
    env = "development"
    
  return env
}

exports.check_config_exists = function (config) {
  path.exists(config, function (exists) {
    if(!exists) {
      console.error("DB file is missing. Please set config file at: " + config)
      process.exit(1)
    }
  });
}
