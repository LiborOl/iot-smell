(function () {
    //noinspection JSUnresolvedFunction
    var app = angular.module('batteryNotificationIoT');

    app.controller('sensors', ['$scope', '$http', '$cookies', 'batteryService', function ($scope, $http, $cookies, batteryService) {

        function init() {
            $scope.dataLoaded = false;
            $scope.projects = [];
            $scope.items = initItems();
            $scope.nearbyItems = initItems();
            $scope.groups = batteryService.groups;
            $scope.appName = batteryService.appName;
            $scope.errorMessage = null;

            $scope.show = $cookies['getObject']('groupSettings') || {
                    alarm: true,
                    warning: true,
                    timeout: true,
                    ok: false,
                    obsolete: false,
                    missingInfo: false
                };
        }

        $scope.groupClicked = function () {
            saveSettings();
            recalculate();
        };

        $scope.projectClicked = function (project) {
            project.show = !project.show;
            $cookies['putObject']('projectsSettings', $scope.projects.map(function (project) {
                return {
                    projectId: project.projectId,
                    show: project.show
                }
            }));
            recalculate();
        };

        $scope.sensorSelectedChange = function () {
            recalculate();
        };

        $scope.selectNearbyItem = function (item) {
            $scope.nearbyItems = item.nearbyItems;
        };

        $scope.refresh = function () {
            init();
            getSensors(true)
        };

        $scope.removeFromSelected = function (sensor) {
            sensor.selected = false;
            recalculate();
        };

        $scope.printSelected = function () {
            $scope.showPrintSelectedSensors = true;
            window.setTimeout(function () {
                var printContents = document.getElementById('printSelectedSensors').innerHTML;
                var popupWin = window.open('', '_blank', '');
                popupWin.document.open();
                popupWin.document.write('<html><head><title>' + batteryService.appName +'</title><link rel="shortcut icon" type="image/png" href="/images/bn.png"><link rel="stylesheet" type="text/css" href="/scripts/css/bootstrap.min.css" /></head><body onload="window.print()">' + printContents + '</body></html>');
                popupWin.document.close();
                $scope.showPrintSelectedSensors = false;
            }, 0)
        };

        $scope.selectAll = function (items) {
            var setState = items.allSelected;
            items.forEach(function (sensor) {
                sensor.selected = setState;
            });
            recalculate();
        };

        init();
        getSensors();

        function saveSettings() {
            $cookies['putObject']('groupSettings', $scope.show);
        }

        function getSensors(forceRefresh) {
            $scope.errorMessage = null;
            var queryString = forceRefresh ? '?forceRefresh=true' : '';
            $http.get('/api/sensors' + queryString).then(function (response) {
                 if (response.data) {
                    if (typeof response.data === 'string') {
                        $scope.errorMessage = response.data;
                        return;
                    }

                    var allSensors = response.data.sensors;
                    var projects = response.data.projects;
                    $scope.projects = projects;
                    var projectsSettings = $cookies['getObject']('projectsSettings') || [];

                    projects.forEach(function (project) {
                        var setting = projectsSettings.find(function (setting) {
                            return setting.projectId === project.projectId
                        });
                        project.show = setting ? setting.show : true;
                    });

                    var lrrs = {};

                    allSensors.forEach(function (sensor) {

                        sensor.lrrIds && sensor.lrrIds.forEach(function (lrrId) {
                            var lrr = lrrs[lrrId];
                            if (!lrr) {
                                lrrs[lrrId] = lrr = [];
                            }
                            lrr.push(sensor);
                        });

                        sensor.selected = batteryService.selectedByDefault(sensor);

                        addByFilter($scope.items, sensor);
                    });

                    allSensors.forEach(function (sensor) {
                        if (sensor.lrrIds) {
                            var itemsNearby = [];
                            sensor.lrrIds.forEach(function (lrrId) {
                                var lrr = lrrs[lrrId];
                                lrr.forEach(function (lrrItem) {
                                    if (sensor !== lrrItem && itemsNearby.indexOf(lrrItem) === -1) {
                                        itemsNearby.push(lrrItem);
                                    }
                                })
                            });

                            sensor.nearbyItems = initItems();
                            itemsNearby.forEach(function (nearbyItem) {
                                addByFilter(sensor.nearbyItems, nearbyItem);
                            });
                            addByFilter(sensor.nearbyItems, sensor);
                        }
                    });

                    recalculate();
                    $scope.dataLoaded = true;
                }
            });
        }

        function initItems() {
            var items = {};
            batteryService.groups.forEach(function (group) {
                items[group.name] = [];
            });
            return items;
        }

        function addByFilter(items, item) {
            batteryService.groups.forEach(function (group) {
                if (group.filter(item)) {
                    addToArray(items, group.name, item);
                }
            });
        }

        function addToArray(items, key, item) {
            if (!items[key]) {
                items[key] = [];
            }
            items[key].push(item);
        }

        function recalculate() {
            calculateItems($scope.items, $scope.projects);
            batteryService.groups.forEach(function (group) {
                $scope.items[group.name].forEach(function (item) {
                    calculateItems(item.nearbyItems, $scope.projects);
                });
            });
            $scope.selectedSensors = getSelectedSensors($scope.items, $scope.projects, $scope.show, batteryService.groups);
            $scope.selectedSensors.sensorsSummary = sensorsSummary($scope.selectedSensors, $scope.projects);
        }

        function calculateItems(items, projects) {
            batteryService.groups.forEach(function (group) {
                items[group.name].sensorsSummary = sensorsSummary(items[group.name], projects);
                items[group.name].allSelected = getAllSelected(items[group.name], projects);
            });
        }

        function sensorsSummary(sensorsArray, projects){
            var filteredSensors = sensorsArray.filter(function (sensor) {
                return sensor.selected && isSensorProjectVisible(sensor, projects)
            });
            return batteryService.sensorsSummary(filteredSensors);
        }
    }]);

    app.filter('bnNearbyCounts', ['batteryService', function (batteryService) {
        return function (item, show, projects, excludeSensor) {
            var ret = [];
            batteryService.groups.forEach(function (group) {
                if (show[group.name]) {
                    ret.push(filterSensors(item[group.name], projects, excludeSensor).length)
                }
            });
            return ret.join('/');
        }
    }]);

    app.filter('bnNearbyIsNone', ['batteryService', function (batteryService) {
        return function (item, show, projects, excludeSensor) {
            return !batteryService.groups.some(function (group) {
                return show[group.name] && filterSensors(item[group.name], projects, excludeSensor).length > 0;
            });
        }
    }]);

    app.filter('bnNearbyTooltip', ['batteryService', function (batteryService) {
        return function (item, show) {
            var ret = [];
            batteryService.groups.forEach(function (group) {
                if (show[group.name]) {
                    ret.push(group.title)
                }
            });
            return ret.join(' / ');
        }
    }]);

    app.filter('bnVisibleProject', function () {
        return filterSensors;
    });

    app.filter('bnIsGroupVisible', function () {
        return function (group, items, projects) {
            return filterSensors(items[group.name], projects).length > 0
        }
    });

    app.filter('bnAllSelectedItems', ['batteryService', function (batteryService) {
        return function(items, projects, show) {
            return getSelectedSensors(items, projects, show, batteryService.groups);
        }
    }]);

    function getSelectedSensors(items, projects, show, groups) {
        var selectedItems = [];
        groups.forEach(function (group) {
            if (!show[group.name]) {
                return;
            }

            items[group.name].forEach(function (sensor) {
                if (!isSensorProjectVisible(sensor, projects)) {
                    return;
                }
                if (!sensor.selected) {
                    return;
                }
                selectedItems.push(sensor);
            })
        });
        return selectedItems;
    }

    function isSensorProjectVisible(sensor, projects) {
        var project = projects.find(function (project) {
            return project['projectId'] === sensor['projectId']
        });
        return project.show;
    }

    function getAllSelected(sensorsArray, projects) {
        var visibleSensors = sensorsArray.filter(function(sensor){
           return isSensorProjectVisible(sensor, projects);
        });
        var someSelected = visibleSensors.some(function (sensor) {
            return sensor.selected
        });
        var someUnselected = visibleSensors.some(function (sensor) {
            return !sensor.selected
        });
        return someSelected && someUnselected ? null : someSelected;
    }

    function filterSensors(sensors, projects, excludeSensor) {
        return sensors.filter(function (sensor) {
            if (sensor === excludeSensor) {
                return false;
            }
            return isSensorProjectVisible(sensor, projects);
        });
    }
})();