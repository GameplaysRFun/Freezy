var r = require("rethinkdb");
var config = require("../config.json");
var conn;
var documentTemplate = {
  "guild": {
    "guild_id": "",
    "perms": {},
    "options": {}
  },
  "tag": {
    "owner_id": "",
    "content": ""
  }
};
r.connect({host: config.database.host, password: config.database.pass, db: config.database.dbName}).then(db => {conn = db;}).catch(e => {console.log(e)});
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
exports.fetchGuildData = function (g) {
  return new Promise((res, rej) => {
    r.tableList().run(conn).then(list => {
      if (list.indexOf("guilds") > -1) {
        r.table("guilds").filter({guild_id: g}).run(conn, (e, re) => {
          if (re._responses.length === 0) {
            var guild = documentTemplate.guild;
            guild["guild_id"] = g;
            r.table("guilds").insert(guild).run(conn, (e, re2) => {return res(re2);});
          } else return res(re);
        });
      } else {
        r.tableCreate("guilds").run(conn).then(tab => {
          var guild = documentTemplate.guild;
          guild["guild_id"] = g;
          r.table("guilds").insert(guild).run(conn, (e, re) => {return res(re);});
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
      if (list.indexOf("guilds") > -1) {
        r.table("guilds").filter({guild_id: g}).run(conn, (er, re) => {
          if (re._responses.length > 0) {
            r.table("guilds").filter({guild_id: g}).update(query).run(conn, (e, re2) => {
              if (e) {
                return rej(e);
              } else return res(re2);
            });
          } else {
            var guild = documentTemplate.guild;
            guild["guild_id"] = g;
            r.table("guilds").insert(guild).run(conn, (e, re2) => {
              r.table("guilds").filter({guild_id: g}).update(query).run(conn, (e, re3) => {
                if (e) return rej(e);
                else return res(re3);
              });
            });
          }
        });
      } else {
        r.tableCreate("guilds").run(conn).then(tab => {
          r.table("guilds").filter({guild_id: g}).run(conn, (er, re) => {
            if (re._responses.length > 0) {
              r.table("guilds").filter({guild_id: g}).update(query).run(conn, (e, re2) => {
                if (e) {
                  return rej(e);
                } else return res(re2);
              });
            } else {
              var guild = documentTemplate.guild;
              guild["guild_id"] = g;
              r.table("guilds").insert(guild).run(conn, (e, re2) => {
                r.table("guilds").filter({guild_id: g}).update(query).run(conn, (e, re3) => {
                  if (e) return rej(e);
                  else return res(re3);
                });
              });
            }
          });
        });
      }
    });
  });
};
exports.fetchTagData = function (tag) {
  return new Promise((res, rej) => {
    r.tableList().run(conn).then(list => {
      if (list.indexOf("tags") > -1) {
        r.table("tags").filter({name: tag}).run(conn, (e, r) => {
          if (e) {
            return rej(e);
          } else return res(r);
        });
      } else {
        r.tableCreate("tags").run(conn).then(r => {
          return res({});
        });
      }
    });
  });
};
exports.editTagData = function (tag, edit) {
  return new Promise((res, rej) => {
    r.tableList().run(conn).then(list => {
      if (list.indexOf("tags") > -1) {
        r.table("tags").filter({name: tag}).run(conn, (e, re) => {
          if (re._responses.length > 0) {
            r.table("tags").filter({name: tag}).update(edit).run(conn, (e, r) => {
              if (e) return rej(e);
              return res(r);
            });
          } else r.table("tags").insert(edit).run(conn, (e, r) => {
              if (e) return rej(e);
              return res(r);
            });
        });
      } else {
        r.tableCreate("tags").run(conn).then(re => {
          r.table("tags").insert(edit).run(conn, (e, r) => {
            if (e) return rej(e);
            return res(r);
          });
        });
      }
    });
  });
};
