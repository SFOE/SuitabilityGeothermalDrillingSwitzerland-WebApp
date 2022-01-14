/**
 * This function detects if a string contains coordinates
 *
 */ 
var isCoordinates =  function(extent, query) {
  var DMSDegree = '[0-9]{1,2}[°|º]\\s*';
  var DMSMinute = '[0-9]{1,2}[\'|′]';
  var DMSSecond = '(?:\\b[0-9]+(?:\\.[0-9]*)?|\\.' +
  '[0-9]+\\b)("|\'\'|′′|″)';
  var DMSNorth = '[N]';
  var DMSEast = '[E]';
  var regexpDMSN = new RegExp(DMSDegree +
  '(' + DMSMinute + ')?\\s*' +
  '(' + DMSSecond + ')?\\s*' +
  DMSNorth, 'g');
  var regexpDMSE = new RegExp(DMSDegree +
  '(' + DMSMinute + ')?\\s*' +
  '(' + DMSSecond + ')?\\s*' +
  DMSEast, 'g');
  var regexpDMSDegree = new RegExp(DMSDegree, 'g');
  var regexpCoordinate = new RegExp(
  '([\\d\\.\']+)[\\s,]+([\\d\\.\']+)');

  var position;
  var valid = false;

  var matchDMSN = query.match(regexpDMSN);
  var matchDMSE = query.match(regexpDMSE);
  if (matchDMSN && matchDMSN.length == 1 &&
    matchDMSE && matchDMSE.length == 1) {
    var northing = parseFloat(matchDMSN[0].
    match(regexpDMSDegree)[0].
    replace('°' , '').replace('º' , ''));
    var easting = parseFloat(matchDMSE[0].
    match(regexpDMSDegree)[0].
    replace('°' , '').replace('º' , ''));
    var minuteN = matchDMSN[0].match(DMSMinute) ?
    matchDMSN[0].match(DMSMinute)[0] : '0';
    northing = northing +
    parseFloat(minuteN.replace('\'' , '').
      replace('′' , '')) / 60;
    var minuteE = matchDMSE[0].match(DMSMinute) ?
    matchDMSE[0].match(DMSMinute)[0] : '0';
    easting = easting +
    parseFloat(minuteE.replace('\'' , '').
      replace('′' , '')) / 60;
    var secondN =
    matchDMSN[0].match(DMSSecond) ?
    matchDMSN[0].match(DMSSecond)[0] : '0';
    northing = northing + parseFloat(secondN.replace('"' , '')
    .replace('\'\'' , '').replace('′′' , '')
    .replace('″' , '')) / 3600;
    var secondE = matchDMSE[0].match(DMSSecond) ?
    matchDMSE[0].match(DMSSecond)[0] : '0';
    easting = easting + parseFloat(secondE.replace('"' , '')
    .replace('\'\'' , '').replace('′′' , '')
    .replace('″' , '')) / 3600;
    position = ol.proj.transform([easting, northing],
      'EPSG:4326', 'EPSG:21781');
    if (ol.extent.containsCoordinate(
    extent, position)) {
      valid = true;
    }
  }

  var match =
    query.match(regexpCoordinate);
  if (match && !valid) {
    var left = parseFloat(match[1].replace('\'', ''));
    var right = parseFloat(match[2].replace('\'', ''));
    var position =
    [left > right ? left : right,
      right < left ? right : left];
    if (ol.extent.containsCoordinate(
      extent, position)) {
    valid = true;
    } else {
    position = ol.proj.transform(position,
      'EPSG:2056', 'EPSG:21781');
    if (ol.extent.containsCoordinate(
      extent, position)) {
      valid = true;
    } else {
      position =
      [left < right ? left : right,
        right > left ? right : left];
      position = ol.proj.transform(position,
      'EPSG:4326', 'EPSG:21781');
      if (ol.extent.containsCoordinate(
      extent, position)) {
      valid = true;
      }
    }
    }
  }
  return valid ?
    [Math.round(position[0] * 1000) / 1000,
    Math.round(position[1] * 1000) / 1000] : undefined;
};


function formatNumber(number) {
  number = '' + number;

  if (number.length > 3) {
    var mod = number.length % 3; 
    var output = (mod > 0 ? (number.substring(0,mod)) : ''); 

    for (i=0 ; i < Math.floor(number.length / 3); i++) {

      if ((mod == 0) && (i == 0))
        output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
      else
        output += '&apos;' + number.substring(mod + 3 * i, mod + 3 * i + 3);
      }
      return (output);
    }

  else
    return number;

};

var getToleranceInPixels = function(toleranceMeters, mapExtent, display) {
  if (!toleranceMeters) {
    return 0;
  }
  var mapMeterWidth = Math.abs(mapExtent[0] - mapExtent[2]);
  var mapMeterHeight = Math.abs(mapExtent[1] - mapExtent[3]);
  var imgPixelWidth = display[0];
  var imgPixelHeight = display[1];
  var factor = Math.max(mapMeterWidth / imgPixelWidth, mapMeterHeight / imgPixelHeight);
  if (isFinite(factor) && !isNaN(factor)) {
    return Math.ceil(toleranceMeters / factor);
  }
  return 0;
}

/**
 * This function scroll smoothly to an element
 */
var goTo = function(id) {
  $('#goTo' + (id.charAt(0).toUpperCase() + id.slice(1))).click();
}
