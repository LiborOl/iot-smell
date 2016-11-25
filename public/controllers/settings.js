(function () {
    //noinspection JSUnresolvedFunction
    var app = angular.module('batteryNotificationIoT');

    app.controller('settings', ['$scope', '$http', 'batteryService', function ($scope, $http, batteryService) {

        function init() {
            $scope.selectedItem = null;
            $scope.generalSettings = batteryService.initGeneralSettings();
        }

        $scope.selectItem = function (item) {
            $scope.selectedItem = $.extend({}, item);
        };

        $scope.saveGeneral = function () {
            $http.put('api/settings/general', batteryService.generalSettingsToJson($scope.generalSettings))
                .success(function () {
                    getSettings();
                })
        };

        $scope.saveSensor = function () {
            $http.put('api/settings/sensors', $scope.selectedItem)
                .success(function () {
                    getSettings();
                })
        };

        init();
        getSettings();

        function getSettings() {
            $http.get('/api/settings').then(function (response) {
                $scope.items = response.data['sensors'];
                $scope.generalSettings = batteryService.generalSettingsFromJson(response.data['general']);
            });
        }
    }]);
})();
