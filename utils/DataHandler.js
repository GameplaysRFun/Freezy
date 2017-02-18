var r = require("rethinkdb");
var config = require("../config.json");
var conn;
r.connect(config.database.host).then(db => {conn = db;}).catch(e => {console.log("FATAL DATABASE FAILURE")});
exports.initialize = function () {
  return new Promise((res, rej) => {
    r.dbList().run(conn).then(rs => {
      conn.use(config.database.dbName);
      if (rs.indexOf(config.database.dbName) === -1) {
        r.dbCreate(config.database.dbName).run(conn, (e) => {
          return res();
        });
      } else {
        return res();
      }
    }).catch(e => {
      return rej(e);
    });
  });
};
exports.fetchGuildData = function (g, query) {
  return new Promise((res, rej) => {
    r.tableList().run(conn).then(list => {
      if (list.indexOf(g) > -1) {
        r.table(g).filter(query).run(conn, (e, r) => {return res(r);});
      } else {
        r.tableCreate(g).run(conn).then(tab => {
          r.table(g).filter(query).run(conn, (e, r) => {return res(r);});
        });
      }
    });
  });
};
exports.fetchUserData = function (u) {
  
};
exports.editUserData = function (u, edit) {
  
};
exports.editGuildData = function (g, query) {
  return new Promise((res, rej) => {
    r.tableList().run(conn).then(list => {
      var q = query;
      if (query.user) q = {user: query.user};
      if (list.indexOf(g) > -1) {
        r.table(g).filter(q).run(conn, (er, re) => {
          if (re._responses.length > 0) {
            r.table(g).filter({user: query.user}).update(query).run(conn, (e, r) => {
              if (e) {
                return rej(e);
              } else return res(r);
            });
          } else {
            r.table(g).insert(query).run(conn, (e, r) => {
              if (e) {
                return rej(e);
              } else return res(r);
            });
          }
        });
      } else {
        r.tableCreate(g).run(conn).then(tab => {
          r.table(g).filter(q).run(conn, (er, r) => {
            if (r._responses.length > 0) {
              r.table(g).filter(q).update(query).run(conn, (e, r) => {
                if (e) {
                  return rej(e);
                } else return res(r);
              });
            } else {
              r.table(g).insert(query).run(conn, (e, r) => {
                if (e) {
                  return rej(e);
                } else return res(r);
              });
            }
          });
        });
      }
    });
  });
};
exports.fetchTagData = function (tag) {
  
};
exports.editTagData = function (tag, edit) {
  
};
