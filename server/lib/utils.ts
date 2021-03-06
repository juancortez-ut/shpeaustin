const Severity = Object.freeze({
  "Log": "log",
  "Error": "error",
  "Info": "info"
});

module.exports = {
    to: function(promise) {
     return promise.then(data => {
        return [null, data];
     })
     .catch(err => [err]);
    },
    getNestedProperty(path, obj) {
      return path.reduce((acc, current) => {
        return (acc && acc[current]) ? acc[current] : null;
      }, obj);
    },
    isObject(obj) {
      return typeof obj === 'object' && obj !== null;
    },
    isEmptyObject(obj) {
      return Object.keys(obj).length === 0; 
    },
    withTimeout: function(promise, timeout = 1000) {
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          return reject("Promise timed out, please try again.");
        }, timeout);
      });

      return Promise.race([promise, timeoutPromise]);
    },
    Severity
}