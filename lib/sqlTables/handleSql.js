var storeReqName = new Array();

exports.manageQueries = (pool, jsonData, requestName, schemaName, callback) => {
  //
  pool.getConnection(function(error, connection) {
    if (firstTimeTrig(requestName)) {
      var objKeyCount = 0;
      loopFunctions(
        connection,
        jsonData,
        requestName,
        schemaName,
        objKeyCount,
        callback
      );
    } else {
      addDetails(connection, jsonData, schemaName, callback);
    }
  });
};

///////////////////////////////////////////////////Local Functions///////////////////////////////
//
//
//
//

//first if
function firstTimeTrig(requestName) {
  if (storeReqName[requestName]) {
    //call to store values
    return false;
  } else {
    storeReqName[requestName] = requestName;
    return true;
  }
}

function loopFunctions(
  connection,
  jsonData,
  requestName,
  schemaName,
  objKeyCount,
  callback
) {
  var jsonKeys = Object.keys(jsonData);
  var keyLength = jsonKeys.length;

  if (keyLength == objKeyCount) {
    addDetails(connection, jsonData, schemaName, callback);
    objKeyCount = 0;
    return;
  }

  searchColumns(connection, schemaName, objKeyCount, jsonKeys, function(
    columnName
  ) {
    if (columnName != null) {
      selectDataType(columnName, function(dataType) {
        addColumns(
          connection,
          jsonData,
          requestName,
          schemaName,
          columnName,
          dataType,
          objKeyCount,
          callback
        );
      });
    } else {
      //run the loop again
      objKeyCount++;
      loopFunctions(
        connection,
        jsonData,
        requestName,
        schemaName,
        objKeyCount,
        callback
      );
    }
  });
}

function searchColumns(
  connection,
  schemaName,
  objKeyCount,
  jsonKeys,
  callback
) {
  connection.query(
    "SELECT " + jsonKeys[objKeyCount] + " FROM " + schemaName,
    function(err, result) {
      if (err) {
        console.log("column ^ not present...adding one rn");
        //addnewColumn(connection,formDataVarName[formObjCount],formData,addOrUpdate);
        callback(jsonKeys[objKeyCount]);
      } else {
        //loopFunctions(connection,jsonData,schemaName,objKeyCount);
        callback(null);
      }
    }
  );
}

function selectDataType(columnName, callback) {
  var splitColumnName = columnName.split("_");
  var typeName = "VARCHAR";
  for (var i in splitColumnName) {
    if (splitColumnName[i] == "Name" || splitColumnName[i] == "Number") {
      callback(typeName + "(100)");
    } else {
      if (i == splitColumnName.length - 1) {
        //call for varchar 255
        callback(typeName + "(255)");
      }
    }
  }
}

function addColumns(
  connection,
  jsonData,
  requestName,
  schemaName,
  columnName,
  dataType,
  objKeyCount,
  callback
) {
  connection.query(
    "ALTER TABLE " +
      schemaName +
      " ADD COLUMN (" +
      columnName +
      " " +
      dataType +
      ")",
    function(err, result) {
      if (err) {
        callback(false, "column: " + columnName + "not added successfuly");
        connection.release();
      } else {
        console.log("column: " + columnName + " added successfuly");
        objKeyCount++;
        loopFunctions(
          connection,
          jsonData,
          requestName,
          schemaName,
          objKeyCount,
          callback
        );
      }
    }
  );
}

function addDetails(connection, jsonData, schemaName, callback) {
  console.log("adding details");
  connection.query("INSERT INTO " + schemaName + " SET ?", jsonData, function(
    err,
    RowResult
  ) {
    if (err) {
      console.log(err);
      callback(false, err);
      connection.release();
    } else {
      callback(true, "successfully stored all the details in " + schemaName);
      connection.release();
    }
  });
}
