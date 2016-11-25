(function () {

    var request = require('request');
    var fs = require('fs');
    var path = require('path');
    var battery = require('./battery');
    var settings = require('./settings');

    //noinspection JSUnresolvedVariable
    var cacheFolder = path.join(__dirname, '..', 'cache');
    var cacheFilePath = path.join(cacheFolder, 'sensors.cache.json');

    var config;

    init();

    function init() {
        var configFileName = 'config.json';
        //noinspection JSUnresolvedFunction,JSUnresolvedVariable
        config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', configFileName), 'utf8'));
        console.log('\n=== reading connection configuration ===');
        console.log('url: ' + config.url);
        console.log('proxy: ' + (config.proxy || 'NONE'));
        if (!config.token) {
            console.log('\nERROR!!!');
            console.error('ERROR: Missing access token in configuration file (' + configFileName + ').\n');
        } else {
            console.log('token: *****');
        }
        console.log('=== reading connection configuration ... done ===\n');
    }

    function getProjectUrl() {
        return config.url + '/project/get?token=' + config.token;
    }

    function getDeviceUrl(project) {
        return config.url + '/device/get/' + project['projectId'] + '?token=' + config.token;
    }

    function getMessageUrl(device) {
        return config.url + '/message/get/' + device['devEUI'] + '?limit=1&token=' + config.token;
    }

    function getPripojMe(url) {
        console.log('requesting: ' + url);
        var settings = {url: url};
        if (config.proxy) {
            settings.proxy = config.proxy;
        }
        return request.get(settings)
            .on('data', function () {
                console.log('response: ' + url);
            })
    }

    function getPripojMeAxios(url) {
        console.log('requesting: ' + url);
        var settings = url;
        if (config.proxy) {
            settings.proxy = config.proxy;
        }
        return axios.get(settings)
            .then(function (respose) {
                console.log('axios response: ' + url);
            })
    }

    function getRecords(dataString) {
        var data = JSON.parse(dataString);
        if (data['_meta'].status === 'ERROR') {
            console.error(JSON.stringify(data));
            return null;
        }
        return data['records'];
    }

    function readSensorsData(forceRefresh, callback) {

        console.log('reading sensors data...');

        if (forceRefresh) {
            try {
                //noinspection JSUnresolvedFunction
                fs.unlinkSync(cacheFilePath);
            } catch (ex) {
                //The file may be deleted already.
            }
        }

        try {
            //noinspection JSUnresolvedFunction
            var cacheFileStat = fs.statSync(cacheFilePath);
            var cacheFileCTime = cacheFileStat && cacheFileStat['ctime'];
            if (cacheFileCTime && (new Date() - new Date(cacheFileCTime) < config['cache_timeout'])) {
                //noinspection JSUnresolvedFunction
                var allDevices = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
                console.log('Returning data from cache.');
                callback(allDevices);
                return;
            }
        } catch (ex) {
            //Cache file does not exist (application is started for the first time or save settings may deleted them)
        }

        try {
            var projectUrl = getProjectUrl();
            var addCustomSensorData = battery.createDataResolver(settings.getSettings());
            getPripojMe(projectUrl)
                .on('data', function (dataString) {
                    var projects = getRecords(dataString);
                    var allDevices = [];
                    var devicesRead = 0;
                    var messagesRead = 0;
                    var allMessagesCount = 0;
                    if (projects) {
                        projects.forEach(function (project) {
                            var deviceUrl = getDeviceUrl(project);
                            getPripojMe(deviceUrl)
                                .on('data', function (deviceDataString) {
                                    devicesRead++;
                                    var devices = getRecords(deviceDataString);
                                    if (devices) {
                                        allMessagesCount += devices.length;
                                        devices.forEach(function (device) {
                                            var messageUrl = getMessageUrl(device);
                                            getPripojMe(messageUrl)
                                                .on('data', function (messageDataString) {
                                                    messagesRead++;
                                                    var messages = getRecords(messageDataString);
                                                    if (messages && messages.length >= 1) {
                                                        var message = messages[0];

                                                        var lrrs = message['lrrs'];
                                                        if (lrrs) {
                                                            device.lrrIds = message['lrrs'].map(
                                                                function (lrr) {
                                                                    return lrr['Lrrid']
                                                                }
                                                            )
                                                        }

                                                        device.createdAt = message['createdAt'];

                                                        addCustomSensorData(device, message)
                                                    } else {
                                                        console.error('No Messages');
                                                        return;
                                                    }
                                                    if (devicesRead === projects.length && messagesRead === allMessagesCount) {
                                                        var resp = {
                                                            projects: projects,
                                                            sensors: allDevices
                                                        };
                                                        //noinspection JSUnresolvedFunction
                                                        if (!fs.existsSync(cacheFolder)) {
                                                            //noinspection JSUnresolvedFunction
                                                            fs.mkdirSync(cacheFolder);
                                                        }
                                                        //noinspection JSUnresolvedFunction
                                                        fs.writeFile(cacheFilePath, JSON.stringify(resp, null, 2), 'utf8');
                                                        console.log('Returning data from IoT server.');
                                                        callback(resp);
                                                    }
                                                })
                                        });
                                        allDevices.push.apply(allDevices, devices);
                                    }
                                })
                        });
                    } else {
                        callback('Unable to read sensors data. Check server log and verify connection configuration.');
                    }
                })
                .on('error', function (err) {
                    console.error('ERROR: Unable to get project data from the server: ' + err);
                    callback('Unable to read sensors data. Check server log and verify connection configuration.')
                })

        } catch (ex) {
            console.error('Unable to read sensors data: ' + ex);
            callback('Server error. Check server log.')
        }
    }

    function readSmellXX(callback) {
        var testData = [
            {devEUI: '767382', lat: 49.7709579, lng: 15.8470745, val: 4.4},
            {devEUI: '767382', lat: 49.9709579, lng: 15.8470745, val: 5.4},
            {devEUI: '767382', lat: 49.8709579, lng: 18.2470745, val: 6.4}
        ];


        callback(testData);
    }

    function readSmell(callback) {
        var configFileName = 'aq-detectors.json';
        var locations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', configFileName), 'utf8'));
        var allMessagesCount = 0;
        var messagesRead = 0;
        var allDevices = [];

        var project = { projectId: 'CistyVzduch'};
        var deviceUrl = getDeviceUrl(project);
        var deviceDataString = '';
        getPripojMe(deviceUrl)
            .on('data', function (newData) {
                deviceDataString += newData;
            })
            .on('end', function () {
                var devices = getRecords(deviceDataString);
                if (devices) {
                    allMessagesCount += devices.length;
                    devices.forEach(function (device) {
                        var location = locations[device.devEUI];
                        if (location) {
                            device.lat = location.latitude;
                            device.lng = location.longitude;
                        }
                        var messageUrl = getMessageUrl(device);
                        getPripojMe(messageUrl)
                            .on('data', function (messageDataString) {
                                messagesRead++;
                                var messages = getRecords(messageDataString);
                                if (messages && messages.length >= 1) {
                                    var message = messages[0];

                                    var lrrs = message['lrrs'];
                                    if (lrrs) {
                                        device.lrrIds = message['lrrs'].map(
                                            function (lrr) {
                                                return lrr['Lrrid']
                                            }
                                        )
                                    }

                                    device.createdAt = message['createdAt'];

                                    addCustomSensorData(device, message)
                                } else {
                                    console.error('No Messages');
                                    return;
                                }
                                if (messagesRead === allMessagesCount) {
                                    var resp =  allDevices;
                                    //noinspection JSUnresolvedFunction
                                    if (!fs.existsSync(cacheFolder)) {
                                        //noinspection JSUnresolvedFunction
                                        fs.mkdirSync(cacheFolder);
                                    }
                                    //noinspection JSUnresolvedFunction
                                    fs.writeFile(cacheFilePath, JSON.stringify(resp, null, 2), 'utf8');
                                    console.log('Returning data from IoT server.');
                                    callback(resp);
                                }
                            })
                    });
                    allDevices.push.apply(allDevices, devices);
                }
            });

        function addCustomSensorData(device, message){
            var payload = message['payloadHex'];
            var quality = parseInt(payload.substr(0, 4), 16);
            console.log('Quality: ' + quality);
            device.quality = quality;
            var temperature = parseInt(payload.substr(4, 4), 16);
            console.log('Temperature: ' + temperature);
            device.temperature = temperature;
            var humidity = parseInt(payload.substr(8, 4), 16);
            console.log('Humidity: ' + humidity);
            device.humidity = humidity;
        }


    }

    module.exports = {
        readSensorsData: readSensorsData,
        readSmell: readSmell
    };
})
();