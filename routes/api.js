var express = require('express');

var settingsData = require('../services/settings.js');
var sensors = require('../services/sensors.js');

var router = express.Router();

router.route('/settings')
    .get(function (req, res) {
        res.json(settingsData.getSettings())
    });

router.route('/settings/general')
    .put(function (req, res) {
        res.json(settingsData.saveGeneralSettings(req.body));
    });

router.route('/settings/sensors')
    .put(function (req, res) {
        res.json(settingsData.saveSensorSettings(req.body));
    });

router.route('/sensors')
    .get(function (req, res) {
        var forceRefresh = req.query['forceRefresh'] === 'true';
        sensors.readSensorsData(forceRefresh, function (data) {
            res.json(data);
        });
    });

module.exports = router;
