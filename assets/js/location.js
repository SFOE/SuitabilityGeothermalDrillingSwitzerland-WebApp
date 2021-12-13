/**
 * Launch the search of an address from a coordinate (EPSG:21781).
 * Returns a promies.
 */
var geocode = function(map, coords) {
  var mapExtent = map.getView().calculateExtent(map.getSize());
  
  pointOne = []
  pointOne[0] = mapExtent[0]
  pointOne[1] = mapExtent[1]
  pointTwo = []
  pointTwo[0] = mapExtent[2]
  pointTwo[1] = mapExtent[3]
  
  // console.log("pointOne: " + pointOne)
  // console.log("pointTwo: " + pointTwo)
  
	 extent1WGS84 = ol.proj.toLonLat(pointOne);
	 extent2WGS84 = ol.proj.toLonLat(pointTwo);
	 
	 
		// //LV95
		// var firstproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs  ";
		// //WGS84
		// var secondproj = "+proj=longlat +datum=WGS84 +no_defs";

		// let [lon, lat] = proj4(secondproj, firstproj, [easting, northing]);

	 
		//LV95
		var firstproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs  ";
		//WGS84
		var secondproj = "+proj=longlat +datum=WGS84 +no_defs";
		
	let [lon1, lat1] = proj4(secondproj, firstproj, [extent1WGS84[0], extent1WGS84[1]]);
	let [lon2, lat2] = proj4(secondproj, firstproj, [extent2WGS84[0], extent2WGS84[1]]); 
	 
  // Get pixel tolerance for 100.0 meters
  var pixelTolerance = getToleranceInPixels(100.0, mapExtent, map.getSize());
  var url = API3_URL + 'rest/services/api/MapServer/identify?' +
     'geometryType=esriGeometryPoint' +
     '&geometry=' + coords.toString() +
     '&imageDisplay=' + map.getSize().toString() + ',96' +
     '&mapExtent=' + lon1.toString() + "," + lat1.toString() + "," + lon2.toString() + "," + lat2.toString() +
     '&tolerance=' + pixelTolerance +
     '&order=distance' +
     '&sr=2056&layers=all:ch.bfs.gebaeude_wohnungs_register&returnGeometry=true';

	
  $(document.body).addClass('ajax-address');
  return $.getJSON(url).then(function(data) {
    $(document.body).removeClass('ajax-address');
    return data;
  });
return $.getJSON(url);
};

// var geocode = function(map, coords) {
  // var mapExtent = map.getView().calculateExtent(map.getSize());
  // // Get pixel tolerance for 100.0 meters
  // var pixelTolerance = getToleranceInPixels(100.0, mapExtent, map.getSize());
  // var url = API3_URL + '/rest/services/api/MapServer/identify?' +
     // 'geometryType=esriGeometryPoint' +
     // '&geometry=' + coords.toString() +
     // '&imageDisplay=' + map.getSize().toString() + ',96' +
     // '&mapExtent=' + mapExtent.toString() +
     // '&tolerance=' + pixelTolerance +
     // '&order=distance' +
     // '&layers=all:ch.bfs.gebaeude_wohnungs_register&returnGeometry=true';
	 
  // $(document.body).addClass('ajax-address');
  // return $.getJSON(url).then(function(data) {
    // $(document.body).removeClass('ajax-address');
    // return data;
  // });
// return $.getJSON(url);
// };
/**
 * Get the current position of the user, then center the map on the
 * corresponding address.
 */
var getLocation = function(map, marker, onAddressFound, map2, marker2, lang, onError) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
  

		// WGS 84
        var firstproj = "+proj=longlat +datum=WGS84 +no_defs";
		// LV95
		var secondproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs ";

		let [easting, northing] = proj4(firstproj, secondproj, [position.coords.longitude, position.coords.latitude]);

		const iconFeature = new ol.Feature({
			geometry: new ol.geom.Point(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]))
		});
		
		coord = [];
		coord[0] = parseInt(easting);
		coord[1] = parseInt(northing);
		console.log(coord);
		
		map.getView().setCenter(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]));
		map.getView().setZoom(19);
		marker.getSource().clear();
		marker.getSource().addFeature(iconFeature);	

		map2.getView().setCenter(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]));
		map2.getView().setZoom(19);
		marker2.getSource().clear();
		marker2.getSource().addFeature(iconFeature);
		
		getCanton(easting, northing, lang, map2);
		geocode(map, coord).then(function(data) {
			ReloadAddress(data.results[0]);
		});	  
	  
    }, function(error) {
      onError(getErrorMsg(error));
    });
  } else {
    onError(getErrorMsg());
  }
};

/**
 * Get a user friendly message when the geolocation is unavailable.
 */
var getErrorMsg = function(error) {
  var msg;
  if (!navigator.geolocation) {
    msg = translator.get('geolocErrorNotSupported');
  } else {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        msg = translator.get('geolocErrorPermDenied')
        break;
      case error.POSITION_UNAVAILABLE:
        msg = translator.get('geolocErrorPosUnavail');
        break;
      case error.TIMEOUT:
        msg = translator.get('geolocErrorTimeOut');
        break;
      case error.UNKNOWN_ERROR:
        msg = translator.get('geolocErrorUnknown');
        break;
    }
  }
  return msg;
 };
