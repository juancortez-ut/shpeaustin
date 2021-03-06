`
 Database.Cloudant.js

 Created by: Juan Cortez
 Date Created: January 25, 2017

 This file serves as a wrapper for the Cloudant database client.

   create              :   Creates a Singleton Database Object with the Cloudant client
`
namespace Database {
    export const Cloudant = (() => {
        const CloudantModule = require('@cloudant/cloudant'),
        database = require("./../lib/database.js"),
        config = require('config'),
        Logger = require('./../lib/logger').createLogger("<Cloudant>"),
        dbKeys = config.dbKeys;
    
        const uuid = require('node-uuid');
        let instance,
            _shpeDbListName = "shpe_website",
            _shpeDb,
            _shpeDbInstancePromise,
            _cachedRevId = {};
    
        function init(args, cb) {
            const username = args.username,
                password = args.password;
    
            // Initialize the library with my account.
            CloudantModule({account:username, password:password}, function(err, cloudant) {
                if (err) {
                    return cb({reason: err});
                } else {
                    instance = cloudant;
                    _setShpeDatabaseInstance(); // point to the SHPE Database
                    return cb(null, cloudant);
                }
            });
        };
    
        function _get(key, cb) {
            if (!_shpeDb && !_shpeDbInstancePromise) {
                return cb({reason: "Shpe database has not been initialized, unable to get from Cloudant"});
            }
    
            _shpeDbInstancePromise.then(() => {
                const cloudantId = _findCloundantId(key);
    
                if (!cloudantId) {
                    return cb({reason: `Unable to find cloudantId for ${key} database key.`});
                }
        
                _shpeDb.get(cloudantId, function(err, data) {
                    if (err) {
                        return cb({reason: err});
                    }
        
                    const keyData = data[key] || null;
        
                    if (!keyData) {
                        return cb({reason: `Data for ${key} not found.`})
                    }
        
                    _cacheRevId(key, data._rev);
        
                    return cb(null, keyData);
                });
            }).catch(err => {
                return cb(err);
            });
        }
    
        function _set(key, data, cb) {
            if (!_shpeDb && !_shpeDbInstancePromise) {
                return cb({reason: "Shpe database has not been initialized, unable to get from Cloudant"});
            }
    
            _shpeDbInstancePromise.then(() => {
                const cloudantId = _findCloundantId(key);
                _getCachedRevisionId(key, (err, cacheId) => {
                    if (err) {
                        Logger.error(err);
                        return cb(err);
                    }
    
                    _shpeDb.insert({
                        [key]: data,
                        "_id": cloudantId,
                        "_rev": cacheId
                    }, cloudantId, function(err, doc) {
                        if(err) {
                            return cb({reason: err});
                        }
        
                        if (doc.ok) {
                            _cacheRevId(key, doc.rev);
                        }
        
                        return cb(null);
                    });
                });
            });
        }
    
        function _delete(key, cb) {
            if (!_shpeDb && !_shpeDbInstancePromise) {
                return cb({reason: "Shpe database has not been initialized, unable to delete from Cloudant"});
            }
    
            Logger.info(`Attemping to delete ${key} key from database.`)
    
            _shpeDbInstancePromise.then(() => {
                _getCachedRevisionId(key, (err, cacheId) => {
                    if (err) {
                        Logger.error(err);
                        return cb(err);
                    }
    
                    const documentId = _findCloundantId(key);
    
                    if (!documentId) {
                        const reason = `Unable to find document id for ${key}`; 
                        Logger.error(reason);
                        return cb(reason);
                    }
    
                    _shpeDb.destroy(documentId, cacheId, (err, response) => {
                        if (err || !response.ok) {
                            Logger.error(`Unable to remove ${key} key.`, err);
                            return cb(err);
                        }
    
                        return cb(null);
                    });  
                });      
            })
            .catch(err => {
                Logger.error(err);
                return cb(err);
            });
        }
    
        function _getCachedRevisionId(key, cb) {
            const cloudantId = _findCloundantId(key);
    
            if (!cloudantId) {
                return cb({
                    reason: `Unable to find cloudantId for ${key} database key.`
                });
            }
    
            const cacheRevId = _cachedRevId[key];
    
            if (!cacheRevId) {
                const reason = `Cache rev id for ${key} does not exist, unable to save changes`;
                return cb({ reason });
            }
    
            return cb(null, cacheRevId);
        }
    
        function _prefetchData() {
            _shpeDbInstancePromise.then(_ => {
                dbKeys.forEach((key) => {
                    let{
                        name
                    } = key;
    
                    _get(name, (err, keyData) => {
                        if (err) {
                            return Logger.error(err);
                        }
    
                        database.cacheData(name, keyData, (err) => {
                            if (err) {
                                Logger.error(`Error: ${err.reason}`);
                                return;
                            }
                            Logger.log(`Successully cached ${name} data!`);
                        });
                    });
                });
            }).catch(err => {
                Logger.error("Unable to prefetch data since SHPE Database was not set ", err);
            });
        }
    
        function _cacheRevId(id, revId) {
            if (!revId) {
                Logger.error(`Unable to cache revId for ${id} key with falsy value.`);
                return;
            }
    
            Object.assign(_cachedRevId, {
                [id]: revId
            });
        }
    
        function _findCloundantId(key) {
            const matchingKey = dbKeys.find(currentKey => currentKey.name === key) || null;
    
            if (matchingKey) {
                const cloudantId = matchingKey.cloudantId || null;
                return cloudantId;
            } else {
                return null;
            }
        }
    
        function _setShpeDatabaseInstance() {
            _shpeDbInstancePromise = new Promise((resolve, reject) => {
                _getShpeDatabaseDocument((err) => {
                    if (err) {
                        return reject(err);
                    }
    
                    _shpeDb = instance.db.use(_shpeDbListName);
                    return resolve("SHPE Database set");
                });
            })
        }
    
        function _getShpeDatabaseDocument(cb) {
            instance.db.list(function(err, dbList, headers) {
                if (err) {
                    return cb({reason: err});
                }
    
                const shpeDbExists = dbList.indexOf(_shpeDbListName) >= 0;
    
                if (!shpeDbExists) {
                    return cb({reason: "Shpe database does not exist...exiting gracefully"});
                }
    
                return cb(null);
            });
        }
    
        return {
            // Get the Singleton instance if one exists
            // or create one if it doesn't
            getInstance: (credentials = null, cb) => {
                if (!credentials) {
                    return cb("Must provide credentials to get database instance");
                }
    
                if (!instance) {
                    return init(credentials, cb);
                }
            },
            get: (key, cb) => {
                if (!instance) {
                    return cb({reason: "Must instantiate a cloudant instance first, failing gracefuly"});
                }
    
                return _get(key, cb);
            },
            set: (key, data, cb) => {
                if (!instance) {
                    return cb({reason: "Must instantiate a cloudant instance first, failing gracefuly"});
                }
    
                return _set(key, data, cb);
            },
            prefetchData: () => {
                if (!instance) {
                    return Logger.error("Must instantiate a cloudant instance first, failing gracefuly");
                }
                return _prefetchData();
            },
            delete: (key, cb) => {
                if (!instance) {
                    return Logger.error("Must instantiate a cloudant instance first, failing gracefuly");
                }
                return _delete(key, cb);
            }
        };
    })();
}

`
Creates a Singleton Database Object with Cloudant

@params credentials{Object}     Object containing username and password

@output callback{Function}      Signature for callback is function(err, data). 
                                If err is truthy, it contains the property, err.reason, describing the error.

`
function init(credentials = null, cb) {
    _checkNumArguments(arguments, 2);

    // create a Singleton
    if (credentials === null) {
        cb({reason: "Must provide credentials to make Cloudant invocation!"});
        return;
    }

    return Database.Cloudant.getInstance(credentials, cb);
}

function prefetchData() {
    Database.Cloudant.prefetchData();
}

function get(key, cb) {
    _checkNumArguments(arguments, 2);

    return Database.Cloudant.get(key, cb);
}

function set(key, data, cb) {
    _checkNumArguments(arguments, 3);

    return Database.Cloudant.set(key, data, cb);
}

function del(key, cb) {
    _checkNumArguments(arguments, 2);

    return Database.Cloudant.delete(key, cb);
}

`
Checks that the number of arguments matches the number of expected arguments
`
function _checkNumArguments(args, expected) {
    let numArgs = args.length || 0;

    if(numArgs !== expected){
        console.error(`Incorrect number of arguments! Expected ${expected} and got ${numArgs}. Request will hang and will ultimately fail.`);
    }
}

module.exports = {
    init,
    get,
    set,
    del,
    prefetchData
}