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
