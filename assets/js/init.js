//onAddressFound
//getCanton
//LV03toLV95
//checkPipelineConsultationAreas
//CheckSuitability
//addWMS
//addURLCantonToButton
//updateSuitabilityInfo
//init
//ReloadAddress
//UpdateURLinBrowser


//First Entry-Point: Search of address -> SwissSearch -> onAddressFound
var onAddressFound = function(map, marker, address, autoSearchRoof, roofSearchTolerance, map2, marker2, lang) {
  $('.typeahead').typeahead('val', '');
  if (address) {
    var coord, label, coordlonlat;
	
	// Address comes from geolocation
    if (!address.attrs) {
      coord = [address.geometry.x, address.geometry.y];
      var attr = address.attributes;
      label = attr.strname_deinr + ' <br>' + attr.dplz4 + ' ' + attr.dplzname;
	  
	// Address comes from search box
    } else {
      // WARNING! Coordinates are inverted here.
      coord = [address.attrs.x, address.attrs.y];
      coordlonlat = [address.attrs.lon, address.attrs.lat];	  
      label = address.attrs.label.replace('<b>', '<br>').replace('</b>', '');
    }
	
    var start = label.search("<br>") + 4;
    var end = start + 4;

    $('#addressOutput').html(label);
    $(document.body).addClass('localized');
    $(document.body).addClass('ajax-roof');	
    $(document.body).addClass('address-found');
    $(document.body).removeClass('localized-error');
    $(document.body).removeClass('no-address');
	
	if ($.contains(document.body, document.getElementById("eignungbutton2"))) {
		document.getElementById("eignungbutton2").className = 'hidden';
		document.getElementById("eignungLong").className = 'hidden';
		document.getElementById("loader").className = '';
	}

    var langs = ['de', 'fr', 'it', 'en'];
    var permalink = addPermalink();
    var lang = (langs.indexOf(permalink.lang) != -1) ? permalink.lang : langs[0];
	
	const iconFeature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.fromLonLat([coordlonlat[0], coordlonlat[1]]))
	});

	map.getView().setCenter(ol.proj.fromLonLat([coordlonlat[0], coordlonlat[1]]));
	map.getView().setZoom(19);
	marker.getSource().clear();
	marker.getSource().addFeature(iconFeature);

	map2.getView().setCenter(ol.proj.fromLonLat([coordlonlat[0], coordlonlat[1]]));
	map2.getView().setZoom(19);
	marker2.getSource().clear();
	marker2.getSource().addFeature(iconFeature);
	
	getCanton(coord[1], coord[0], lang, map2, lang);

	
  } else { //address = false
    $(document.body).removeClass('localized');
    $(document.body).removeClass('address-found');
    $(document.body).addClass('no-address');
    if (autoSearchRoof) {
      $(document.body).removeClass('roof no-roof no-roof-outside-perimeter');
    }
  }
};


var getCanton = function (easting, northing, lang, map2, lang) {
	
  var CantonShort = "";

  if (easting && northing) {

    var query = '//api3.geo.admin.ch/rest/services/api/MapServer/identify?' +
            'geometryType=esriGeometryPoint' +
            '&returnGeometry=false' +
            '&layers=all:ch.swisstopo.swissboundaries3d-kanton-flaeche.fill' +
            '&geometry=' + easting + ',' + northing + 
            '&mapExtent=' + easting + ',' + northing + ',' + easting + ',' + northing +
            '&imageDisplay=100,100,96' +
            '&tolerance=0' + 
            '&lang=de';
			
	if (parseInt(easting) > 2000000) {
		query = query + '&sr=2056';
	}
	
			
    $.getJSON(query).then(function(data) { //success(data)
      	if (data.results && data.results.length > 0) {

	        $.each(data.results, function(key, val) {
	    
	          CantonShort = val.attributes.ak;
			  
			  if (parseInt(easting) > 2000000) {
				checkPipelineConsultationAreas(easting, northing, CantonShort, map2, lang);
			  } else {
				LV03toLV95(easting, northing, CantonShort, map2);
			  }
			  UpdateURLinBrowser(easting, northing, CantonShort, lang);
			  
	        });
        
	    }

    });
	
	

  }

}

var LV03toLV95 = function (easting, northing, canton, map2) {
	
	query = "//geodesy.geo.admin.ch/reframe/lv03tolv95?easting=" + easting + "&northing=" + northing + "&format=json";

    $.getJSON(query).then(function(data) {
		
		checkPipelineConsultationAreas(data.easting, data.northing, CantonShort, map2, lang);
		
    });
	
}

// old check PipelineConsultationAreas based on huge PipelineConsultationAreas of https://s.geo.admin.ch/95dcebbe3c
// replaced because only 20m areas are relevant
// var checkPipelineConsultationAreas = function (easting, northing, CantonShort, map2, lang) {

	// query = "https://wms.geo.admin.ch/?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&FORMAT=image/png&TRANSPARENT=true&QUERY_LAYERS=ch.bfe.rohrleitungen-konsultationsbereiche&LAYERS=ch.bfe.rohrleitungen-konsultationsbereiche&FEATURE_COUNT=10&INFO_FORMAT=text/plain&LANG=de&I=1&J=1&CRS=EPSG:2056&WIDTH=2&HEIGHT=2&BBOX=" + String(Math.round(easting)) + "," + String(Math.round(northing)) + "," + String(Math.round(easting+2)) + "," + String(Math.round(northing+2));
	
	// $.get(query, function(data) {
		// let result = data.indexOf("Search returned no results.");
	  
		// if (result === -1) { //inside of PipelineConsultationArea
			// CheckSuitability(easting, northing, CantonShort, map2, lang, true);
		// } else { //outside of PipelineConsultationArea
			// CheckSuitability(easting, northing, CantonShort, map2, lang, false);
		// }
	// });	

// }

var checkPipelineConsultationAreas = function (easting, northing, CantonShort, map2, lang) {

	// LV95
	var firstproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs";
	// WGS84
	var secondproj = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

	let [lon, lat] = proj4(firstproj, secondproj, [easting, northing]);

	d3.json('PipelinesConsultationAreas_generalised.json')
	  .then(function(geojson) {
		  
		var IsPointInsideConsultationArea = false;
		
		polygons = geojson.geometries;
		
		polygons.forEach(function(d) {
			
			if (d3.geoContains(d, [lon, lat]) === false) {
				IsPointInsideConsultationArea = true;
			}

		})


		if (IsPointInsideConsultationArea === true) { //inside of PipelineConsultationArea
			CheckSuitability(easting, northing, CantonShort, map2, lang, true);
		} else { //outside of PipelineConsultationArea
			CheckSuitability(easting, northing, CantonShort, map2, lang, false);
		}


	  });

}

var CheckSuitability = function (easting, northing, canton, map2, lang, ConsultationArea) {
	
	if (ConsultationArea === true) { // inside ConsultationArea
		
		suitability = 6;
		updateSuitabilityInfo(suitability);
		
	} else { // outside ConsultationArea -> check suitability

		var distance = 15;
		var suitability = 999;

		var p1 = new Promise((resolve, reject) => {
			BfeLib.CheckSuitabilityCanton(parseInt(easting), parseInt(northing), canton, false).then(harmonisedValue => { 
				resolve(harmonisedValue);
			});
		});

		var p2 = new Promise((resolve, reject) => {
			BfeLib.CheckSuitabilityCanton(parseInt(easting)+distance, parseInt(northing), canton, false).then(harmonisedValue => { 
				resolve(harmonisedValue);
			});
		});

		var p3 = new Promise((resolve, reject) => {
			BfeLib.CheckSuitabilityCanton(parseInt(easting)-distance, parseInt(northing), canton, false).then(harmonisedValue => { 
				resolve(harmonisedValue);
			});
		});

		var p4 = new Promise((resolve, reject) => {
			BfeLib.CheckSuitabilityCanton(parseInt(easting), parseInt(northing)+distance, canton, false).then(harmonisedValue => { 
				resolve(harmonisedValue);
			});
		});

		var p5 = new Promise((resolve, reject) => {
			BfeLib.CheckSuitabilityCanton(parseInt(easting), parseInt(northing)-distance, canton, false).then(harmonisedValue => { 
				resolve(harmonisedValue);
			});
		});
		
		Promise.all([p1, p2, p3, p4, p5]).then(values => {
			
			var check_1 = 0;
			var check_2 = 0;
			var check_3 = 0;
			var check_4 = 0;
			var check_5 = 0;
			var suit_tot = values[0] + values[1] + values[2] + values[3] + values[4];
			
			if (values[0] == 1 || values[1] == 1 || values[2] == 1 || values[3] == 1 || values[4] == 1) {
					check_1 = 1; //irgendein Ergebnis hat value 1
			}
			
			if (values[0] == 2 || values[1] == 2 || values[2] == 2 || values[3] == 2 || values[4] == 2) {
					check_2 = 1; //irgendein Ergebnis hat value 2
			}

			if (values[0] == 3 || values[1] == 3 || values[2] == 3 || values[3] == 3 || values[4] == 3) {
					check_3 = 1; //irgendein Ergebnis hat value 3
			}

			if (values[0] == 4 || values[1] == 4 || values[2] == 4 || values[3] == 4 || values[4] == 4) {
					check_4 = 1; //irgendein Ergebnis hat value 4
			}

			if (values[0] == 5 || values[1] == 5 || values[2] == 5 || values[3] == 5 || values[4] == 5) {
					check_5 = 1; //irgendein Ergebnis hat value 5
			}
			

			if ((check_1 + check_2 + check_3 + check_4 + check_5) == 1) { //eindeutiges Ergebnis 1, 2, 3, 4 oder 5
				suitability = values[0];
			} else if ((check_1 + check_2 + check_3) == 3) {
				suitability = 2;
			} else if ((check_1 + check_3) == 2) {
				suitability = 2;
			} else if ((check_2 + check_3) == 2) {
				suitability = 2;
			} else if ((check_1 + check_2) == 2) {
				suitability = 2;
			} else {
				suitability = 2;
			}

			updateSuitabilityInfo(suitability);

		}, reason => {
		  console.log(reason)
		});
	
	}
	
	
	
	

	addWMS(canton, map2);
	addURLCantonToButton(canton, lang);

	//Show Legende
	document.getElementById("GetWMSLegend").innerHTML = '';
	BfeLib.GetWMSLegendCanton(canton).then(legendUrl => {
		var URLLists = '';

		legendUrl.forEach(element => {
			
			if (element === undefined || element == "") {
				URLLists += "<img src='images/empty.png' alt='Legende'/><br>";
			} else {
				URLLists += "<img src='" + element + "' alt='Legende'/><br>";
			}
		});
		document.getElementById("GetWMSLegend").innerHTML = URLLists;
	});
		
}

var addWMS = function (canton, map2) {

	// remove all layers in map2
	map2.getLayers().forEach(layer => {
		if (layer && layer.get('name') != 'background-layer2' && layer.get('name') != 'markerLayer2') {
			map2.removeLayer(layer);
		}
	});	
	
	//Kantonaler WMS hinzufügen
	// BfeLib.SetProxyServer('https://bfe-cors-anywhere.herokuapp.com/');
	// BfeLib.GetWMSCanton(canton, true, true).then(url => {
	BfeLib.GetWMSCanton(canton, true).then(url => {

		url.forEach(element => {
			
			if (element != undefined) {

				var newLayer = new ol.layer.Image({
					source: element,
					opacity: 0.5
				});

				map2.addLayer(newLayer);
				
				if (canton == "VD") {
					newZoom = 15;		
				} else {
					newZoom = 19;
				}
				map2.getView().setZoom(newZoom);
			
			}

		});
		
	});
	
}


var addURLCantonToButton = function (canton, lang) {
	
  if (canton) {

  url = "cantonsWebsites.json";

    $.getJSON(url).then(function(data) {
		
		data.forEach(myFunction);
		
		function myFunction(data) {

			if (data.name == canton) {

				if (lang == "de") {
					
					if ($.contains(document.body, document.getElementById("cantonButton"))) {
						document.getElementById("cantonButton").href = data.URLde;
					}
					
				} else if (lang == "fr") {
					
					if ($.contains(document.body, document.getElementById("cantonButton"))) {
						document.getElementById("cantonButton").href = data.URLfr;
					}
					
				} else {
					
					if ($.contains(document.body, document.getElementById("cantonButton"))) {
						document.getElementById("cantonButton").href = data.URLit;
					}	
					
				}

			}  
			
		}
        
    });

  }

	
}

// var addAllWMS = function (map2) {
	
	// cantons = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH","LI"]

	// cantons.forEach(myFunction);
	 
	// function myFunction(item, index) {
		// addWMS(item, map2)
	// }

// }

var updateSuitabilityInfo = function(suitability) {

	var langs = ['de', 'fr', 'it', 'en'];
	var headers = ['0','1'];
	var permalink = addPermalink();

	var header = (headers.indexOf(permalink.header) != -1) ? permalink.header : headers[0];
	var lang = (langs.indexOf(permalink.lang) != -1) ? permalink.lang : langs[0];

	//Ausgabe Eignung
	if ($.contains(document.body, document.getElementById("eignungbutton2"))) {
		document.getElementById("eignungbutton2").className = 'button2 scrolly button2suit' + suitability;
	}
	
	if ($.contains(document.body, document.getElementById("eignung"))) {	
		$('#eignung').html(translator.get('suitability' + suitability + 'short'));
	}

	if ($.contains(document.body, document.getElementById("eignungLong"))) {	
		$('#eignungLong').html(translator.get('suitability' + suitability));
		document.getElementById("eignungLong").className = '';		
	}
	
	document.getElementById("loader").className = 'hidden';

	//add css-class
	$(document.body).removeClass('no-roof').removeClass('no-roof-outside-perimeter').addClass('roof');

};



/**
 * Initialize the element of the app: map, search box, localizaton
 */
var init = function(nointeraction) {
  $.support.cors = true;
  window.API3_URL = 'https://api3.geo.admin.ch/';
  
  var langs = ['de', 'fr', 'it', 'en'];
  var headers = ['0','1'];
  var body = $(document.body);
  var locationBt = $('#location');
  var markerElt = $('<div class="marker ga-crosshair"></div>');
  var permalink = addPermalink();

  // Load Header
  var header = (headers.indexOf(permalink.header) != -1) ? permalink.header : headers[0];

  if (header == '1') {
    //EnergieSchweiz Header
    $('#ech').removeClass('hide');
    $('#orange').removeClass('hide');
  } else {
    $('#eig').removeClass('hide');
    $('#red').removeClass('hide');
  }

  // Load the language
  var lang = (langs.indexOf(permalink.lang) != -1) ? permalink.lang : langs[0]; 
  window.translator = $('html').translate({
    lang: lang,
    t: sdTranslations // Object defined in tranlations.js
  });

  if (header == '1') {
    if (lang == 'de') {
      $('#logoech').css('background','url("images/echlogo-de.png") no-repeat center left');
    } else if (lang == 'fr') {
      $('#logoech').css('background','url("images/echlogo-fr.png") no-repeat center left');
    } else if (lang == 'it') {
      $('#logoech').css('background','url("images/echlogo-it.png") no-repeat center left');
    } else if (lang == 'en') {
      $('#logoech').css('background','url("images/echlogo-de.png") no-repeat center left');
    }
  } 


  //add locate-symbol
  if ($.contains(document.body, document.getElementById("location"))) {
    document.getElementById("location").innerHTML = document.getElementById("location").innerHTML + ' <span class="icon fa-location-arrow"></span>';
  }

	const backgroundLayer = new ol.layer.Tile({
		id: "background-layer",
		name: "background-layer",
		source: new ol.source.XYZ({
			url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg`
		})
	});


	const marker = new ol.layer.Vector({
		zIndex: 100,
		name: "markerLayer",
		source: new ol.source.Vector(),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: 'images/marker.png'
			})
		})
	});
	
	const backgroundLayer2 = new ol.layer.Tile({
		id: "background-layer2",
		name: "background-layer2",
		source: new ol.source.XYZ({
			url: `https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg`
		})
	});


	const marker2 = new ol.layer.Vector({
		zIndex: 100,
		name: "markerLayer2",
		source: new ol.source.Vector(),
		style: new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 46],
				anchorXUnits: 'fraction',
				anchorYUnits: 'pixels',
				src: 'images/marker.png'
			})
		})
	});

	const map = new ol.Map({
		layers: [
			backgroundLayer, marker
		],
		target: 'map',
		view: new ol.View({
			projection: "EPSG:3857",
			center: [900000, 5900000],
			zoom: 8,
			minZoom: 7,
			maxZoom: 20
		}),
	});
	
	const map2 = new ol.Map({
		layers: [
			backgroundLayer2, marker2
		],
		target: 'map2',
		view: new ol.View({
			projection: "EPSG:3857",
			center: [900000, 5900000],
			zoom: 8,
			minZoom: 7,
			maxZoom: 20
		}),
	});

	// Handle map click: fill out form and submit
	map.on('click', function(evt) {

		// LV95
		var secondproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs ";
		// 
		var firstproj = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs";

		let [lon, lat] = proj4(firstproj, secondproj, evt.coordinate);
		const iconFeature = new ol.Feature({
			geometry: new ol.geom.Point(evt.coordinate)
		});
		
		if ($.contains(document.body, document.getElementById("eignungbutton2"))) {
			document.getElementById("eignungbutton2").className = 'hidden';
			document.getElementById("eignungLong").className = 'hidden';
			document.getElementById("loader").className = '';
		}
		
		map.getView().setCenter(evt.coordinate);
		map.getView().setZoom(19);
		marker.getSource().clear();
		marker.getSource().addFeature(iconFeature);	

		map2.getView().setCenter(evt.coordinate);
		map2.getView().setZoom(19);
		marker2.getSource().clear();
		marker2.getSource().addFeature(iconFeature);

		coord = [];
		coord[0] = parseInt(lon);
		coord[1] = parseInt(lat);		

		getCanton(lon, lat, lang, map2, lang);
		geocode(map, coord).then(function(data) {
			ReloadAddress(data.results[0]);
		});	
	});

	// Init address-Search
	initSearch(map, marker, onAddressFound, map2, marker2);
		
	// Init geoloaction button
	locationBt.click(function() {
	  body.removeClass('localized-error');
	  getLocation(map, marker, onAddressFound, map2, marker2, lang, function(msg) {
		$(document.body).addClass('localized-error');
		$('#locationError').html(msg);
	  });
	});	

    // Display the feature from permalink
    if (permalink.X && permalink.Y) {
	
		coord = [];
		coord[0] = parseInt(permalink.X);
		coord[1] = parseInt(permalink.Y);
		northing = parseInt(permalink.Y);
		easting = parseInt(permalink.X);
		
		if ($.contains(document.body, document.getElementById("eignungbutton2"))) {
			document.getElementById("eignungbutton2").className = 'hidden';
			document.getElementById("eignungLong").className = 'hidden';
			document.getElementById("loader").className = '';
		}		

		// Add marker at current location to map
		//LV95
		var firstproj = "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs  ";
		//WGS84
		var secondproj = "+proj=longlat +datum=WGS84 +no_defs";

		let [lon, lat] = proj4(firstproj, secondproj, [easting, northing]);
		const iconFeature = new ol.Feature({
			geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat]))
		});
		
		map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
		map.getView().setZoom(19);
		marker.getSource().clear();
		marker.getSource().addFeature(iconFeature);

		map2.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
		map2.getView().setZoom(19);
		marker2.getSource().clear();
		marker2.getSource().addFeature(iconFeature);

		getCanton(easting, northing, lang, map2, lang);
		
        goTo('one');
		
		geocode(map, coord).then(function(data) {
			ReloadAddress(data.results[0]);
		});	
	}

  if ($.contains(document.body, document.getElementById("socialTwitter"))) {
    document.getElementById("socialTwitter").href = 
    'https://twitter.com/intent/tweet?text=' + translator.get('pagetitle').replace(" ","%20") + '&url=' + translator.get('domain') + '&related=BFEgeoinfo,BFEenergeia,EnergieSchweiz&hashtags=ErneuerbarHeizen&via=EnergieSchweiz';
  }

  if ($.contains(document.body, document.getElementById("socialFB"))) {
    document.getElementById("socialFB").href = 
    'http://www.facebook.com/sharer.php?u=' + translator.get('domain').replace(" ","%20");
  }

  if ($.contains(document.body, document.getElementById("socialMail"))) {
    document.getElementById("socialMail").href = 
    'mailto:?subject=' + translator.get('pagetitle') + ' ' + translator.get('domain');
  }

  var linkhintButton = '';

  if (lang == 'de') {
    linkhintButton = 'https://erneuerbarheizen.ch/';
  } else if (lang == 'fr') {
    linkhintButton = 'https://www.chauffezrenouvelable.ch/';
  } else if (lang == 'it') {
    linkhintButton = 'https://www.calorerinnovabile.ch/';
  } else if (lang == 'en') {
    linkhintButton = 'https://erneuerbarheizen.ch/';
  }  

  if ($.contains(document.body, document.getElementById("hintButton"))) {
    document.getElementById("hintButton").href = linkhintButton;
  }

  // Remove the loading css class 
	body.removeClass('is-loading');

  $(document).ready(function ()
  {
      document.title = translator.get('pagetitle');
  });
  
}

var ReloadAddress = function (address) {

	var attr = address.attributes;
	label = attr.strname_deinr + ' <br>' + attr.dplz4 + ' ' + attr.dplzname;

	var start = label.search("<br>") + 4;
	var end = start + 4;

	$('#addressOutput').html(label);
	$(document.body).addClass('localized');
	$(document.body).addClass('address-found');
	$(document.body).removeClass('localized-error');
	$(document.body).removeClass('no-address');
	
}

function UpdateURLinBrowser(X, Y, canton, lang) {

  var stateObj = { foo: "bar" };
  history.pushState(stateObj, "", "index.html?X=" + Math.round(X) + "&Y=" + Math.round(Y) + "&canton=" + canton + "&lang=" + lang);

}