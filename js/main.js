$(document).ready(function() {
  // Tooltip only Text
  jqueryFunction = function(){

    $('.masterTooltip').hover(function(){
      // Hover over code
      var title = $(this).attr('title');
      $(this).data('tipText', title).removeAttr('title');
      $('<p class="tooltip"></p>')
          .text(title)
          .appendTo('body')
          .fadeIn('slow');
    }, function() {
      // Hover out code
      $(this).attr('title', $(this).data('tipText'));
      $('.tooltip').remove();
    }).mousemove(function(e) {
      var mousex = e.pageX + 20; //Get X coordinates
      var mousey = e.pageY + 10; //Get Y coordinates
      $('.tooltip')
          .css({ top: mousey, left: mousex })
    });
  }

  $.get("tides/stations.json",function(stations) {window.lats=stations; });

});

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 25.7823072, lng: -80.3010434},
    zoom: 12
  });
  var input = document.getElementById('pac-input');
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  var elevator = new google.maps.ElevationService;
  var infowindow = new google.maps.InfoWindow();
  var infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);
  var marker = new google.maps.Marker({
    map: map
  });
  marker.addListener('click', function() {
    infowindow.open(map, marker);
  });

  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    // Set the position of the marker using the place ID and location.
    marker.setPlace({
      placeId: place.place_id,
      location: place.geometry.location
    });
    marker.setVisible(true);

    var latitude = place.geometry.location.lat();
    var longitude = place.geometry.location.lng();
    var latLng = place.geometry.location;

    displayLocationElevation(latLng, elevator, infowindow);

    var best_dist=999999999;
    var best_stn = null;
    for (i=0; i<lats.length; i++) {
      var cur_stn=lats[i];
      var cur_dist = getDistanceFromLatLonInKm(cur_stn[2],cur_stn[3],latitude,longitude);

      if (Math.abs(cur_dist) < Math.abs(best_dist)) {
        best_stn=cur_stn;
        best_dist=Math.abs(cur_dist);
      }
    }
    var miles =  (best_dist*0.62137).toPrecision(5);
    document.getElementById("stationdist").innerHTML = 'Distance to station = ' + miles + ' miles.';
    if (miles > 2) {
      document.getElementById("madlib").style.display="block";
      document.getElementById("madlib").insertAdjacentHTML('beforeEnd','Your distance to the tide monitoring station is ' + miles + ' miles. The farther you are from the station, the longer it will take flooding from high tides, if any, to reach you.');
    }
    else if (miles <= 2) {
      document.getElementById("madlib").style.display="block";
      document.getElementById("madlib").insertAdjacentHTML('beforeEnd','Your distance to the tide monitoring station is ' + miles + ' miles. The closer you are to the station, the more likely you are to see flooding around the time of the high tides.');
    }
    var passy= "tides/" + best_stn[1] + "_annual.xml";
    loadXMLDoc(passy);

  });
}

function getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
  const Radius = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
  ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Radius * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}

function madElevate(theElevation) {
  if (theElevation < 3) {
    document.getElementById("madlib").insertAdjacentHTML('beforeEnd', 'Your elevation of ' + theElevation + ' is low. The likelihood that you will see flooding during the high tides is increased.');
  }

  else if (theElevation < 8) {
    document.getElementById("madlib").insertAdjacentHTML('beforeEnd', 'Your elevation of ' + theElevation + ' indicates that the likelihood that you will see flooding during the high tides is average.');
  }

  else if (theElevation >= 8) {
    document.getElementById("madlib").insertAdjacentHTML('beforeEnd', 'Your elevation of ' + theElevation + ' is high for south Florida and indicates that the likelihood that you will see flooding during the high tides is decreased.');
  }
}

function loadXMLDoc(mystation) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      loadArray(this);
    }
  };
  xmlhttp.open("GET", mystation, true);
  xmlhttp.send();
}

function displayLocationElevation(location, elevator, infowindow) {
  // Initiate the location request
  elevator.getElevationForLocations(
      {'locations': [location]},
      function(results, status) {
        infowindow.setPosition(location);
        if (status === 'OK') {
          // Retrieve the first result
          if (results[0]) {
            // Open the info window indicating the elevation at the clicked position.
            var elevateme = (3.28084*(results[0].elevation)).toPrecision(2);

            document.getElementById("elevate").innerHTML = 'Your elevation is  ' + elevateme + ' feet.';

            madElevate(elevateme);
          }
        }
      }
  );
}