(function () {
    var app = angular.module('batteryNotificationIoT');

    app.controller('sensors', ['$scope', '$http', '$cookies', 'batteryService', function ($scope, $http, $cookies, batteryService) {
        init();

        function init() {

        }

    }])
})();


function getCircle(magnitude) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: magnitude < 5 ? 'blue' : 'red',
        fillOpacity: .2,
        scale: Math.pow(2, magnitude) / 2,
        strokeColor: 'white',
        strokeWeight: .5
    };
}

var map;

function initMap() {
    console.log('Init Map');

    $.get('/api/smell', function (data) {
        drawMap(data);
    });

    function drawMap(data) {
        var uluru = {lat: 49.7709579, lng: 15.8470745};
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 7,
            center: uluru
        });

        data.forEach(function (dato) {
            if (dato.lat && dato.lng) {
                new google.maps.Marker({
                    position: {lat: dato.lat, lng: dato.lng},
                    map: map,
                    icon: getCircle(qualityToMagnitude(dato.quality))
                })
            } else {
                console.error('Unknown location for sensor devEUI: ' + dato.devEUI);
            }
        });
    }

    function qualityToMagnitude(quality) {
        return quality / 10000;
    }
}
