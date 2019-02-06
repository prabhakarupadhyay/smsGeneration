global.SchemaName = {
  User: {
    Schema: "USER_QUESTION_SCHEMA"
  }
};

exports.createTables = pool => {
  pool.getConnection(function(error, connection) {
    if (!error) {
      createTableUser(connection);
    }
  });
};

function createTableUser(connection) {
  connection.query(
    "CREATE TABLE IF NOT EXISTS " +
      SchemaName.User.Schema +
      "(Id INT NOT NULL AUTO_INCREMENT PRIMARY KEY)",
    function(err, result) {
      if (err) {
        console.log(err);
        return;
      }
      console.log("table created: " + SchemaName.User.Schema);
    }
  );
}
