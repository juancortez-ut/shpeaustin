/*
  API documentation: https://medium.com/@nolanbrown/august-lock-rest-apis-the-basics-7ec7f31e7874
*/
const { isEmptyObject } = require('../lib/utils');
const privateCredentials = require('./../lib/credentialsBuilder.js').init();
const request = require('request');

const LockStates = Object.freeze({
    Locked: "kAugLockState_Locked",
    Unlocked: "kAugLockState_Unlocked"
});

let _instance;

class AugustApi {
  constructor() {
    this.prelog = "<AugustApi>";
    this._authToken = privateCredentials.august.token;
    this._augustLockId = null;

    return _instance = this;
  }

  static getInstance() {
    if (_instance) {
      return _instance;
    }

    return new AugustApi();
  }

  /*
    Initialize August API by getting the lock id since it is used in all other requests.
    Since I only have one august lock, I will only retrieve the only lock available.
    
    TODO: future support for more locks
  */
    initialize(cb) {
        const options = {
            url: 'https://api-production.august.com/users/locks/mine',
            headers: this._getHeaders()
        };

        request(options, (err, result) => {
            if (err) {
                this._log(err);
                return cb(err);
            } else {
                try {
                    const augustResponse = JSON.parse(result.body);
                    if (augustResponse && !isEmptyObject(augustResponse)) {
                        const keys = Object.keys(augustResponse);
                        this._augustLockId = keys.shift();
                        this._log(`Successfully initialized with August lock id, ${this._augustLockId}`);
                        return cb(null);
                    } else {
                        const error = "Did not find any August locks...";
                        this._log(error);
                        return cb(err);
                    }
                } catch(e) {
                    this._log(e);
                    return cb(err);
                }
            }
        });
    }

    arm(lock = true) {
        return new Promise((resolve, reject) => {
            if (!this._augustLockId) {
                const err = "August has not yet successfully initialized, unable to lock system";
                this._log(err);
                return reject(err);
            }

            const shouldLock = lock ? "lock": "unlock";

            const options = {
                method: "PUT",
                url: `https://api-production.august.com/remoteoperate/${this._augustLockId}/${shouldLock}`,
                headers: this._getHeaders()
            };

            request(options, (err, request, body) => {
                if (err) {
                    this._log(err);
                    return reject(err);
                }

                let augustResponse;
                
                try {
                    augustResponse = body ? JSON.parse(body) : null;
                } catch(e) {
                    return reject("Invalid response sent from August API");
                }

                const augustState = augustResponse.status || "";

                if (lock && augustState === LockStates.Locked) {
                    this._log("Successfully locked August lock");
                    return resolve();
                }

                if (!lock && augustState === LockStates.Unlocked) {
                    this._log("Successfully unlocked August lock");
                    return resolve();
                }

                return reject(body);
            });
        });
    }

  _log(log) {
    console.log(`${this.prelog}: ${log}`);
  }

  _getHeaders() {
      const augustApiKey = "79fd0eb6-381d-4adf-95a0-47721289d1d9";

      return {
          "Content-Type": "application/json",
          "Accept-Version": "0.0.1",
          "User-Agent": "August/Luna-3.2.2",
          "x-kease-api-key": augustApiKey,
          "x-august-api-key": augustApiKey,
          "x-august-access-token": this._authToken
      }
  }
}

module.exports = AugustApi;