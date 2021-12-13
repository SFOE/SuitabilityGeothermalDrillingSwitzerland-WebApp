var boundingExtentXYs_ = function(xs, ys) {
    var minX = Math.min.apply(null, xs);
    var minY = Math.min.apply(null, ys);
    var maxX = Math.max.apply(null, xs);
    var maxY = Math.max.apply(null, ys);
    return [minX, minY, maxX, maxY];
};

var getForViewAndSize = function(center, resolution, rotation, size) {
    var dx = resolution * size[0] / 2;
    var dy = resolution * size[1] / 2;
    var cosRotation = Math.cos(rotation);
    var sinRotation = Math.sin(rotation);
    /** @type {Array.<number>} */
    var xs = [-dx, -dx, dx, dx];
    /** @type {Array.<number>} */
    var ys = [-dy, dy, -dy, dy];
    var i, x, y;
    for (i = 0; i < 4; ++i) {
        x = xs[i];
        y = ys[i];
        xs[i] = center[0] + x * cosRotation - y * sinRotation;
        ys[i] = center[1] + x * sinRotation + y * cosRotation;
    }
    return boundingExtentXYs_(xs, ys);
};

/**
 * Launch the search of all the features available at a cordinates.
 * Returns a promise.
 */



/**
 * Launch the search of a feature defined by its id.
 * Returns a promise.
 */
var searchFeatureFromId = function(featureId) {
  var url = API3_URL + '/rest/services/all/MapServer/' +
      'ch.bfe.solarenergie-eignung-daecher/' + 
      featureId + '?geometryFormat=esriGeojson';
  $(document.body).addClass('ajax-roof');
  return $.getJSON(url).then(function(data) {
    $(document.body).removeClass('ajax-roof');
    return data;
  });
};

/**
 * Launch the search for the best roof of a building.
 * Returns a promise.
 */
var searchBestRoofFromBuildingId = function(buildingId) {
  var url = API3_URL + '/rest/services/api/MapServer/find?' +
      'layer=ch.bfe.solarenergie-eignung-daecher&' +
      'searchField=building_id&' +
      'searchText=' + buildingId +
      '&contains=false';
  $(document.body).addClass('ajax-roof');
  return $.getJSON(url).then(function(data) {
    var bestRoof = data.results[0];
    for (var i = 0; i < data.results.length; i++) {
      roofCandidate = data.results[i];
      if (roofCandidate.attributes.mstrahlung >
          bestRoof.attributes.mstrahlung) {
        bestRoof = roofCandidate;
      }
    }
    $(document.body).removeClass('ajax-roof');
    return bestRoof;
  });
};


/**
 * Transform the input element in search box
 */
var initSearch = function(map, marker, onAddressFound, map2, marker2) {
  var view = map.getView();
	// Get swisssearch parameter
	var swisssearch = window.sessionStorage.getItem('swisssearch');

  // Create the suggestion engine
	var mySource = new Bloodhound({
	   datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
	   queryTokenizer: function(query) {
		  var center = isCoordinates(view.getProjection().getExtent(), query);
		  if (center) {
			  view.setCenter(center);
			  marker.setPosition(center);
		  }
		  return Bloodhound.tokenizers.whitespace;
	   },
	   remote: {   
       url: API3_URL + '/rest/services/api/SearchServer?lang=de&sr=2056&searchText=%QUERY&type=locations',
       wildcard: '%QUERY',
		   filter: function(locations) {
			   var results = [];
			   if (locations.results) {
			     $.each(locations.results, function(key, location) {
				     if (location.attrs.origin == 'address' || location.attrs.origin == 'parcel') {
				       results.push(location);
	 			     }
	 		     });
			   }
			   return results;
		   
       }
	   }
	});

	// this kicks off the loading and processing of local and prefetch data
	// the suggestion engine will be useless until it is initialized
	mySource.initialize();

  // Create the 2 typeahead search box
  var searchInputs = $('.typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 3
  }, {
	  name: 'location',
	  displayKey: function(location) {
		  return location.attrs.label.replace('<b>', '').replace('</b>', '');
	  },
    limit: 30,
	  source: mySource.ttAdapter(),
	  templates: {
		  suggestion: function(location) {
		    return '<div>' + location.attrs.label + '</div>';
		  }
	  }                                      
	});
  searchInputs.attr('placeholder', translator.get('placeholder')); 
	searchInputs.placeholder();
	searchInputs.on('typeahead:selected', function(evt, location, suggName) {
		onAddressFound(map, marker, location, true, 0.0, map2, marker2);
    //scroll to section one
    if (this.id == 'searchTypeahead1') {
      goTo('one');
      $(this).blur();
    }
	}).on('typeahead:asyncrequest', function() {
    $(this).addClass('loading'); 
  }).on('typeahead:asyncreceive', function() {
    $(this).removeClass('loading'); 
  });
};