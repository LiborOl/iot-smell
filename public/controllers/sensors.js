(function () {
    var app = angular.module('batteryNotificationIoT');

    app.controller('sensors', ['$scope', '$http', '$cookies', 'batteryService', function ($scope, $http, $cookies, batteryService) {
        init();

        function init() {

            setDataLoaded = setDataLoadedNG;

        }

        function setDataLoadedNG(data) {
            $scope.dataLoaded = true;
            var worst = data.sort(function(a, b){
                return b.quality - a.quality
            });
            $scope.worst = worst.slice(0, 5);
            $scope.$apply();
        }

    }])
})();

var setDataLoaded;


function getCircle(quality) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: qualityToColor(quality),
        fillOpacity: .2,
        scale: 19.5,
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

        var openedInfoWindow = null;

        data.forEach(function (dato) {
            if (dato.lat && dato.lng) {
                var marker = new google.maps.Marker({
                    position: {lat: dato.lat, lng: dato.lng},
                    map: map,
                    icon: getCircle(dato.quality),
                    title: getTitle(dato)
                });
                var infowindow = new google.maps.InfoWindow({
                    content: '<dl>' +
                    '<dt>devEUI:</dt>' +
                    '<dd>' + dato.devEUI + '</dd>' +
                    '<dt>quality:</dt>' +
                    '<dd>' + (dato.quality) + '</dd>' +
                    '<dt>Temperature:</dt>' +
                    '<dd>' + (dato.temperature / 10) + '</dd>' +
                    '<dt>Humidity:</dt>' +
                    '<dd>' + (dato.humidity / 10) + '</dd>' +
                    '</dl>'
                });

                marker.addListener('click', function() {
                    if (openedInfoWindow) {
                        openedInfoWindow.close();
                    }
                    infowindow.open(map, marker);
                    openedInfoWindow = infowindow;
                });
            } else {
                console.error('Unknown location for sensor devEUI: ' + dato.devEUI);
            }
        });

        console.log('loading done');
        setDataLoaded(data);
    }

    function getTitle(dato) {
        return '' +
            'devEUI: ' + dato.devEUI + '\n' +
            'Cistota: ' + (dato.quality / 1000)
    }

    function qualityToMagnitude(quality) {
        return quality / 10000;
    }
}

function qualityToColor(quality) {
    if (quality < 150)
        return 'blue';
    else return 'red';
}


