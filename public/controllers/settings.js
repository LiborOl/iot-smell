(function () {
    //noinspection JSUnresolvedFunction
    var app = angular.module('batteryNotificationIoT');

    app.controller('settings', ['$scope', '$http', 'batteryService', function ($scope, $http, batteryService) {

        function init() {
            $scope.selectedItem = null;
            $scope.generalSettings = batteryService.initGeneralSettings();
        }

        $scope.selectItem = function (key, item) {
            $scope.selectedItem = $.extend({}, item);
            $scope.selectedItem.key = key;
        };

        $scope.saveGeneral = function () {
            $http.put('api/settings/general', batteryService.generalSettingsToJson($scope.generalSettings))
                .success(function () {
                    getSettings();
                })
        };

        $scope.saveSettings = function () {
            var data = {};
            data[$scope.selectedItem.key] = {};
            data[$scope.selectedItem.key].latitude = parseFloat($scope.selectedItem.latitude);
            data[$scope.selectedItem.key].longitude = parseFloat($scope.selectedItem.longitude);
            $http.post('api/aq-detectors', data)
                .success(function () {
                    getSettings();
                })
        };

        init();
        getSettings();

        function getSettings() {
            $http.get('/api/aq-detectors').then(function (response) {
                $scope.items = response.data;
            });
        }
    }]);
})();
