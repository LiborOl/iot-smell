(function () {

    function checkBitIsSet(number, bitIndex) {
        return (number >> bitIndex) % 2 != 0
    }

    function _RHF1S001(payload) {
        return (parseInt(payload.substr(16, 2), 16) + 150) * 10;
    }

    function _ARF8084BA(payload) {
        var stateByte = parseInt(payload.substr(0, 2), 16);
        if (!checkBitIsSet(stateByte, 1)){
            return null;
        }
        var batteryIndex = 12;
        if (!checkBitIsSet(stateByte, 2)) {
            batteryIndex--;  // Down Counter is not present
        }
        if (!checkBitIsSet(stateByte, 3)) {
            batteryIndex--;  // Up Counter is not present
        }
        if (!checkBitIsSet(stateByte, 4)) {
            batteryIndex -= 8;  // GPS info is not present
        }
        if (!checkBitIsSet(stateByte, 7)) {
            batteryIndex--;  //  T°C info is not present
        }
        return parseInt(payload.substr(batteryIndex * 2, 4), 16);
    }

    function _DTH(payload) {
        return parseInt(payload.substr(4, 2), 16) * 100 + parseInt(payload.substr(6, 2), 16);
    }

    function _S0(payload) {
        return parseInt(payload.substr(4, 4), 16);
    }

    function _DeSense(payload) {
        return parseInt(payload.substr(6, 4), 16);
    }

    function _DeSenseLight(payload) {
        return parseInt(payload.substr(6, 4), 16);
    }

    function _DeSenseSoil(payload) {
        return parseInt(payload.substr(6, 4), 16);
    }

    function _DeSenseWind(payload) {
        return parseInt(payload.substr(6, 4), 16);
    }

    function _DeSenseNoise(payload) {
        return parseInt(payload.substr(6, 4), 16);
    }

    function _EL001() {
        return null;
    }

    module.exports = {
        RHF1S001: _RHF1S001,
        ARF8084BA: _ARF8084BA,
        DTH: _DTH,
        S0: _S0,
        DeSense: _DeSense,
        DeSenseLight: _DeSenseLight,
        DeSenseSoil: _DeSenseSoil,
        DeSenseWind: _DeSenseWind,
        DeSenseNoise: _DeSenseNoise,
        EL001: _EL001
    }
})();