/*eslint no-unused-vars: off*/

function openMissionPopup(id) {
    missionsLayer.eachLayer(function(layer){
        if (layer.feature.properties.id == id)
        {
            if (missionsClusters.hasLayer(layer))
                missionsClusters.zoomToShowLayer(layer);
            layer.openPopup(mainMap.center);
        }
    });
}


// Load Missions to missions table tab
var loadMissions = function(err, missions) {
    if (err) {
        alert('Error loading missions: ' + err);
    } else {
        $('#missionsContainer').html(
            '<table class="table table-hover" id="missionsTable"><thead><tr><th>&nbsp;</th><th>Name</th><th>Region</th><th>Start</th><th>End</th><th>Severity</th><th>Capacity</th></tr></thead><tbody>'
        );

        $.each(missions, function(key, value) {
            $('#missionsTable').append(
                '<tr id=\'mrow'+value.properties.id+'\' class=\'cursorPointer\' onclick=\'openMissionPopup('+value.properties.id+')\'>'
        +'<td><a data-toggle=\'modal\' data-target=\'#missionModal\' href=\'#\' onclick=\'onMissionLinkClick(' +
          value.properties.id +
          ')\' class=\'contact-link btn btn-sm btn-primary\' title=\'Quick View\'><i class=\'glyphicon glyphicon-eye-open\'></i></a></td><td>' +
          value.properties.properties.name +
          '</td><td>' +
          value.properties.properties.region +
          '</td><td>' +
          value.properties.properties.startDate +
          '</td><td>' +
          value.properties.properties.finishDate +
          '</td><td>' +
          value.properties.properties.severity +
          '</td><td>' +
          value.properties.properties.capacity +
          '</td></tr>'
            );
        });

        $('#missionsTable').append('</tbody></table>');
    }
};

// Perform GET call to get Missions
var getMissions = function(term) {

    var url='/api/missions?geoformat=geojson' +(term ? ('&search='+term) :'');
    var lngmin = mainMap.getBounds().getSouthWest().wrap().lng;
    var latmin = mainMap.getBounds().getSouthWest().wrap().lat;
    var lngmax = mainMap.getBounds().getNorthEast().wrap().lng;
    var latmax = mainMap.getBounds().getNorthEast().wrap().lat;
    url = url+'&lngmin='+lngmin+'&latmin='+latmin+'&lngmax='+lngmax+'&latmax='+latmax;
    $.getJSON(
        url,
        function(data) {
            loadMissions(null, data.result.features);
            mapMissions(data.result);
            missionsLayer.eachLayer(function(layer) {
                layer.on('mouseover',function(e){$('#mrow'+layer.feature.properties.id).addClass('isHovered');});
                layer.on('mouseout',function(e){$('#mrow'+layer.feature.properties.id).removeClass('isHovered');});
                layer.on('touchstart',function(e){$('#mrow'+layer.feature.properties.id).addClass('isHovered');});
                layer.on('touchend',function(e){$('#mrow'+layer.feature.properties.id).removeClass('isHovered');});
            });
        }).fail(function(err) {
        if (err.responseText.includes('expired')) {
            alert('session expired');
        } else {
            loadMissions(err.responseText, null);
        }
    });
};


// variables for mission data
var missionData = {};
var missionCoordinates = {};

// open mission modal on click
var onMissionLinkClick = function(id) {
    $.getJSON('/api/missions/' + id, function(data) {
        missionData = data ? data.result.objects.output.geometries[0].properties.properties : {};
        missionCoordinates = data ? data.result.objects.output.geometries[0].coordinates : {};
        $( '#missionModalBody' ).load( '/events/mission.html' );
    }).fail(function(err) {
        if (err.responseText.includes('expired')) {
            alert('session expired');
        } else {
            alert('error: '+ err.responseText);
        }
    });
};

//Create a throttled version
var thGetMissions=_.throttle(getMissions, 300);

//attach handler to different map events
mainMap.on('load', function(){thGetMissions(null);});
mainMap.on('moveend', function(){thGetMissions($('#missSearchTerm').val());});


$('#missSearchTerm').on('input',function(){
    thGetMissions(this.value);
});
