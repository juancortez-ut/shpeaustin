import { HueLight } from "./../models";

/// <reference path="../router/main.ts" />
namespace Routes {        
    const express = require('express'),
        app = express(),
        AugustApi = require('./../services/august'),
        HueApi = require('./../services/hue'),
        Logger = require('./../lib/logger').createLogger("<AuthenticationController>"),
        { to } = require('../lib/utils');

    const BlinkApi = require('./../services/blink');
    const middleware = require('./../middleware/ShortcutsMiddleware');

    /*
        Convert Decimal Degrees to Degrees Minutes Seconds (DMS)

        /shortcuts/coordinates?longitude=-13.12&latitude=45.65

        Example result:
            {
                "latitude": "-13 degrees, 7 minutes, 11 seconds",
                "longitude": "45 degrees, 38 minutes, 59 seconds"
            }    
    */
    app.get('/coordinates', middleware.shortcutsAuth, (req, res) => {
        const { longitude, latitude } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).send("Must provide latitude and longitude query parameters");
        }

        // Convert to numbers
        const latitudeQuery = +latitude;
        const longitudeQuery = +longitude;

        if (!latitudeQuery || !longitudeQuery) {
            return res.status(400).send("Latitude and longitude values are not valid numbers.");
        }

        try {
            const latitudeResult = _calculateDegreesMinutesSeconds(latitudeQuery);
            const longtitudeResult = _calculateDegreesMinutesSeconds(longitudeQuery);
            const readableLatitude = _convertToReadable(latitudeResult);
            const readableLongtitude = _convertToReadable(longtitudeResult);

            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
                "latitude": readableLatitude,
                "longitude": readableLongtitude
            });
        } catch(e) {
            return res.status(500).send("Invalid latitude and longitude values");
        }
    });

    app.get('/august', middleware.middlewareLogger, middleware.shortcutsAuth, async (req, res) => {
        const shouldArmAugustLock = _shouldArm(req);
        const armModeStr = shouldArmAugustLock ? "locked" : "unlocked";

        if(!shouldArmAugustLock) {
            const shouldDisarmBlink = req.query.disarmBlink == 'true';
            /* Extra feature: Disarm blink when august door gets unlocked */
            if (shouldDisarmBlink) {
                await to(_disarmBlink());
            }

            _turnOnBedroomLights();
        }

        const augustApi = AugustApi.getInstance();
        const [ err ] = await to(augustApi.arm(shouldArmAugustLock));

        if (err) {
            Logger.error(err);
            return res.status(400).send("Error in August API, please try again later." + err);
        }

        return res.status(200).send(`August was successfully, ${armModeStr}`);
    });


    app.get('/blink/isArmed', middleware.middlewareLogger, middleware.shortcutsAuth, async (req, res) => {
        const blinkApi = _getBlinkInstance();
        const [err, result] = await to(blinkApi.isArmed());

        if (err) {
            Logger.error(err);
            return res.status(400).send("Unable to detect, please try again later.");
        } else {
            return res.status(200).send(`Blink is armed: ${result}`);
        }
    });

    app.get('/blink/setArm', middleware.middlewareLogger, middleware.shortcutsAuth, async (req, res) => {
        const shouldArm = _shouldArm(req);
        const armModeStr = shouldArm ? "armed mode" : "unarmed mode";

        const blinkApi = _getBlinkInstance();

        const [err] = await to(blinkApi.setArmed(shouldArm));

        if (err) {
            return res.status(400).send(`Unable to perform operation to arm the system to ${armModeStr}`);
        } else {
            return res.status(200).send(`Blink successful set to: ${armModeStr}`);
        }
    });

    app.get('/full/security', middleware.middlewareLogger, middleware.shortcutsAuth, async (req, res) => {
        const augustApi = AugustApi.getInstance();
        const [ augustErr ] = await to(augustApi.arm(true));

        const blinkApi = _getBlinkInstance();
        const [ blinkErr ] = await to(blinkApi.setArmed(true));

        if (augustErr || blinkErr) {
            return res.status(400).send(`An operation failed. August: ${augustErr}, Blink: ${blinkErr}`);
        } else {
            const msg = `Security system fully armed.`;
            Logger.log(msg);
            return res.status(200).send(msg);
        }
    });

    async function _disarmBlink() {
        Logger.log("Attempt to disarm Blink...");
        const blinkApi = _getBlinkInstance();
        const [err] = await to(blinkApi.setArmed(false));
        if (err) {
            Logger.error(`Unable to unarm blink ${err}`);
        } else {
            Logger.log(`Successfully disarmed blink`);
        }
    }

    function _turnOnBedroomLights() {
        const hueApi = HueApi.getInstance();
        hueApi.turnOn(HueLight.Bed);
        hueApi.turnOn(HueLight.Bedside);
    }

    function _getBlinkInstance() {
        return BlinkApi.getInstance();
    }

    function _shouldArm(req) {
        const shouldArmQuery = req.query.arm || false;
        return shouldArmQuery == 'true';
    }

    /*
        Will convert from decimal degrees to DMS

        Example response:
            {
                "decimal": 42,
                "minutes": 6,
                "seconds": 30.7
            }
    */
    function _calculateDegreesMinutesSeconds(input) {
        const decimalWholeNum = _getWholeNumber(input);

        const inputDecimal = Math.abs(_getDecimal(input));
        const inputMinutes = inputDecimal * 60;
        const inputMinutesWholeNum = _getWholeNumber(inputMinutes);

        const inputMinutesDecimal = _getDecimal(inputMinutes);
        const inputSeconds = inputMinutesDecimal * 60;
        const inputSecondsWholeNum = inputSeconds.toFixed(1);

        return {
            "decimal": decimalWholeNum,
            "minutes": inputMinutesWholeNum,
            "seconds": inputSecondsWholeNum
        };
    }

    /*
        Convert to an example such as:
            42 degrees, 21 minutes, 36.6 seconds
    */
    function _convertToReadable(input) {
        const { decimal, minutes, seconds } = input;
        return `${decimal} degrees, ${minutes} minutes, ${seconds} seconds`
    }

    function _getWholeNumber(num) {
        return num > 0 ? Math.floor(num) : Math.ceil(num);
    }

    function _getDecimal(num) {
        return num % 1;
    }

    module.exports = app;
}