(function () {
    //noinspection JSUnresolvedFunction
    var app = angular.module('batteryNotificationIoT');

    app.factory('batteryService', [function () {

        var sensorTimeoutMultiplier = 1000 * 60 * 60 * 24; //Convert to days
        var sensorObsoleteMultiplier = 1000 * 60 * 60 * 24; //Convert to days

        var groups = [
            {
                name: 'alarm',
                filter: function (item) {
                    return item.isAlarm
                },
                title: 'Battery Alarm',
                description: 'These sensors are very low on battery. The battery should be changed very soon.',
                class: 'panel-danger'
            },
            {
                name: 'timeout',
                filter: function (item) {
                    return item.isTimeout
                },
                title: 'Timeout',
                description: 'These sensors did not respond for long time. They are broken, battery is depleted or they were removed.',
                class: 'panel-warning'
            },
            {
                name: 'warning',
                filter: function (item) {
                    return item.isWarning
                },
                title: 'Battery Warning',
                description: 'These sensors are getting low on battery, but they will still work for some time.',
                class: 'panel-info'
            },
            {
                name: 'ok',
                filter: function (item) {
                    return item.isOk
                },
                title: 'Ok',
                description: 'These sensors do not need new battery.',
                class: 'panel-success'
            },
            {
                name: 'missingInfo',
                filter: function (item) {
                    return !groups.some(function (group) {
                        return group.name !== 'missingInfo' && group.filter(item)
                    })
                },
                title: 'Missing Information',
                description: 'We do not have information about sensors type, we cannot read the voltage of the sensors battery or the sensors do not have battery at all.',
                class: 'panel-default'
            },
            {
                name: 'obsolete',
                filter: function (item) {
                    return item.isObsolete
                },
                title: 'Obsolete',
                description: 'These sensors did not response for very long time. They were probably removed.',
                class: 'panel-default'
            }
        ];

        function sensorsSummary(filteredSensorsArray) {
            var statisticObject = {};
            var unknownCount = 0;
            filteredSensorsArray.forEach(function (sensor) {
                var batteryDisplayName = sensor.battery;
                if (batteryDisplayName) {
                    statisticObject[batteryDisplayName] = (statisticObject[batteryDisplayName] || 0) + 1;
                } else if (sensor.batteryType === 'unknown') {
                    unknownCount++;
                }
            });
            var ret = [];
            for (var key in statisticObject) {
                if (statisticObject.hasOwnProperty(key) && key !== '____unknown') {
                    ret.push({type: key, count: statisticObject[key]});
                }
            }
            if (unknownCount) {
                ret.push({type: 'unknown', count: unknownCount});
            }
            return ret;
        }

        function selectedByDefault(sensor) {
            return !!(sensor.battery || sensor.batteryType === 'unknown');
        }

        function initGeneralSettings() {
            return {
                sensorTimeout: '-',
                sensorTimeout_edit: null,
                sensorObsolete: '-',
                sensorObsolete_edit: null
            }
        }

        function generalSettingsFromJson(data) {
            return {
                sensorTimeout: data['sensorTimeout'] / sensorTimeoutMultiplier,
                sensorTimeout_edit: data['sensorTimeout'] / sensorTimeoutMultiplier,
                sensorObsolete: data['sensorObsolete'] / sensorObsoleteMultiplier,
                sensorObsolete_edit: data['sensorObsolete'] / sensorObsoleteMultiplier
            }
        }

        function generalSettingsToJson(generalSettings) {
            return {
                sensorTimeout: generalSettings.sensorTimeout_edit * sensorTimeoutMultiplier,
                sensorObsolete: generalSettings.sensorObsolete_edit * sensorObsoleteMultiplier
            }
        }

        return {
            appName: 'Čistý vzduch',
            groups: groups,
            sensorsSummary: sensorsSummary,
            selectedByDefault: selectedByDefault,
            initGeneralSettings: initGeneralSettings,
            generalSettingsToJson: generalSettingsToJson,
            generalSettingsFromJson: generalSettingsFromJson
        }
    }])
})();