(function () {

    var batteryModels = require('./batteryModels.js');

    function createDataResolver(allSettings) {
        var sensorSettings = allSettings.sensors;
        var generalSettings = allSettings.general;

        return function addCustomSensorData(device, message) {
            var getBatteryVoltage = batteryModels[device['model']];
            if (!getBatteryVoltage) {
                console.error('ERROR: Missing battery function (see "battery.js") for battery model="' + device['model'] + '"')
            } else {
                device.batteryVoltage = getBatteryVoltage(message['payloadHex']);
                var deviceSetting = sensorSettings.find(function (s) {
                    return s['model'] === device['model']
                });
                if (deviceSetting) {
                    device.battery = deviceSetting.battery;
                    device.batteryType = deviceSetting.batteryType;
                    if (device.batteryVoltage) {
                        if (deviceSetting['batteryWarningLevel'] && deviceSetting['batteryAlarmLevel']) {
                            device.isObsolete = device.createdAt && ((new Date() - new Date(device.createdAt) > generalSettings.sensorObsolete));
                            device.isTimeout = !device.isObsolete && device.createdAt && ((new Date() - new Date(device.createdAt) > generalSettings.sensorTimeout));
                            device.isAlarm = !device.isObsolete && !device.isTimeout && device.batteryVoltage < deviceSetting['batteryAlarmLevel'] * 1000;
                            device.isWarning = !device.isObsolete && !device.isTimeout && !device.isAlarm && device.batteryVoltage < deviceSetting['batteryWarningLevel'] * 1000;
                            device.isOk = !device.isObsolete && !device.isTimeout && !device.isAlarm && !device.isWarning;
                        } else {
                            console.error('ERROR: Sensor configuration (see "sensorTypes.json") does not contain "batteryWarningLevel" or "batteryAlarmLevel" for model="' + device['model'] + '"');
                        }
                    }
                } else {
                    console.error('ERROR: Sensor configuration not found (see "sensorTypes.json") for model="' + device['model'] + '"')
                }
            }
        }
    }

    function addSettingsToSensorType(sensorType, setting) {
        sensorType.batteryWarningLevel = setting.batteryWarningLevel;
        sensorType.batteryAlarmLevel = setting.batteryAlarmLevel;
    }

    function createOrLoadGeneralSetting(generalSettings) {
        return {
            sensorTimeout: generalSettings.sensorTimeout || 20 * 24 * 60 * 60 * 1000,
            sensorObsolete: generalSettings.sensorObsolete || 30 * 24 * 60 * 60 * 1000
        }
    }

    function saveSensorSettings(data, saveTo) {
        saveTo.batteryWarningLevel = data.batteryWarningLevel;
        saveTo.batteryAlarmLevel = data.batteryAlarmLevel;
    }

    function saveGeneralSettings(data, saveTo) {
        saveTo.sensorTimeout = data["sensorTimeout"];
        saveTo.sensorObsolete = data["sensorObsolete"];
    }

    module.exports = {
        createDataResolver: createDataResolver,
        addSettingsToSensorType: addSettingsToSensorType,
        createOrLoadGeneralSetting: createOrLoadGeneralSetting,
        saveSensorSettings: saveSensorSettings,
        saveGeneralSettings: saveGeneralSettings
    }
})();