(function () {

    var fs = require('fs');
    var path = require('path');
    var battery = require('./battery');
    //noinspection JSUnresolvedVariable
    var settingsFileName = path.join(__dirname, '..', 'data', 'sensorSettings.json');
    //noinspection JSUnresolvedVariable
    var settingTypesFileName = path.join(__dirname, '..', 'data', 'sensorTypes.json');
    //noinspection JSUnresolvedVariable
    var cacheFilePath = path.join(__dirname, '..', 'cache', 'sensors.cache.json');

    init();

    function init(){
        deleteCache();
    }

    function getSettings() {

        //noinspection JSUnresolvedFunction
        var sensorTypesContent = fs.readFileSync(settingTypesFileName, 'utf8');
        var sensorTypes = JSON.parse(sensorTypesContent);

        try {
            //noinspection JSUnresolvedFunction
            var sensorSettingsContent = fs.readFileSync(settingsFileName, 'utf8');
            var allSettings = JSON.parse(sensorSettingsContent);
            var sensorSettings = allSettings['sensors'] || [];
        } catch (e) {
            allSettings = {general: {}, sensors: []};
            sensorSettings = allSettings['sensors'];
        }

        sensorSettings.forEach(function (setting) {
            sensorTypes.forEach(function (sensorType) {
                if (sensorType.model === setting.model) {
                    battery.addSettingsToSensorType(sensorType, setting)
                }
            })
        });

        return {
            general: battery.createOrLoadGeneralSetting(allSettings.general),
            sensors: sensorTypes
        };
    }

    function saveGeneralSettings(newSetting) {
        try {
            //noinspection JSUnresolvedFunction
            var sensorSettingsContent = fs.readFileSync(settingsFileName, 'utf8');
            var allSettings = JSON.parse(sensorSettingsContent);
        } catch (ex) {
            console.log('Sensor setting file does not exist or is invalid. Creating new setting file.');
        }
        var generalSetting = {};
        battery.saveGeneralSettings(newSetting, generalSetting);

        var newAllSettings = {
            general: generalSetting,
            sensors: allSettings && allSettings.sensors || []
        };

        writeSettings(newAllSettings);
        deleteCache();

        return newSetting;
    }

    function saveSensorSettings(newSetting) {

        try {
            //noinspection JSUnresolvedFunction
            var sensorSettingsContent = fs.readFileSync(settingsFileName, 'utf8');
            var allSettings = JSON.parse(sensorSettingsContent);
            var sensorSettings = allSettings['sensors'] || [];
        } catch (ex) {
            console.log('Sensor setting file does not exist or is invalid. Creating new setting file.');
            allSettings = {
                general: {},
                sensorSettings: []
            };
            sensorSettings = allSettings.sensorSettings;
        }

        var settingExists = false;
        sensorSettings.forEach(function (setting) {
            if (newSetting.model === setting.model) {
                settingExists = true;
                battery.saveSensorSettings(newSetting, setting);
            }
        });
        if (!settingExists) {
            var setting = {
                model: newSetting.model
            };
            battery.saveSensorSettings(newSetting, setting);
            sensorSettings.push(setting)
        }

        var newAllSettings = {
            general: allSettings.general,
            sensors: sensorSettings
        };

        writeSettings(newAllSettings);
        deleteCache();

        return newSetting;
    }

    function writeSettings(settings) {
        //noinspection JSUnresolvedFunction
        fs.writeFileSync(settingsFileName, JSON.stringify(settings, null, 2), 'utf8');
    }

    function deleteCache() {
        try {
            //noinspection JSUnresolvedFunction
            fs.unlinkSync(cacheFilePath);
        } catch (ex) {
            //The file may be deleted already.
        }
    }

    module.exports = {
        getSettings: getSettings,
        saveGeneralSettings: saveGeneralSettings,
        saveSensorSettings: saveSensorSettings
    };
})();
