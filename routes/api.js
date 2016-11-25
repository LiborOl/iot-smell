var express = require('express');
var fs = require("fs");
var path = require('path');

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


var aqdFileName = path.join(__dirname, '..', 'data', 'aq-detectors.json');

router.route('/aq-detectors')
    .get(function (req, res) {
        var dataJson = fs.readFileSync(aqdFileName, 'utf8');
        res.end(dataJson);
    });

router.route('/aq-detectors')
    .post(function (req, res) {
        var dataJson = fs.readFileSync(aqdFileName, 'utf8');
        var data = JSON.parse(dataJson);
        Object.assign(data, req.body);
        fs.writeFileSync(aqdFileName, JSON.stringify(data, null, 2), 'utf8');
        res.end(JSON.stringify(req.body));
    });

router.route('/aq-detectors/:id')
    .get(function (req, res) {
        var dataJson = fs.readFileSync(aqdFileName, 'utf8');
        var data = JSON.parse(dataJson);
        res.end(JSON.stringify(data[req.params.id], null, 2));
    });

router.route('/aq-detectors/:id')
    .delete(function (req, res) {
        var dataJson = fs.readFileSync(aqdFileName, 'utf8');
        var data = JSON.parse(dataJson);
        delete data[req.params.id];
        fs.writeFileSync(aqdFileName, JSON.stringify(data, null, 2), 'utf8');
        res.end();
    });

module.exports = router;
