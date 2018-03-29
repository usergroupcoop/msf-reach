/*eslint no-unused-vars: off*/

// Create map
var newReportMap = L.map('newReportMap').setView([20, 110], 4);
var autocompleteMap=newReportMap;
newReportMap.locate({setView: true, maxZoom: 16});
// Add some base tiles
var NRmapboxTerrain = L.tileLayer('https://api.mapbox.com/styles/v1/acrossthecloud/cj9t3um812mvr2sqnr6fe0h52/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWNyb3NzdGhlY2xvdWQiLCJhIjoiY2lzMWpvOGEzMDd3aTJzbXo4N2FnNmVhYyJ9.RKQohxz22Xpyn4Y8S1BjfQ', {
    attribution: '© Mapbox © OpenStreetMap © DigitalGlobe',
    minZoom: 0,
    maxZoom: 18
}).addTo(newReportMap);

// Add some satellite tiles
var NRmapboxSatellite = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoidG9tYXN1c2VyZ3JvdXAiLCJhIjoiY2o0cHBlM3lqMXpkdTJxcXN4bjV2aHl1aCJ9.AjzPLmfwY4MB4317m4GBNQ', {
    attribution: '© Mapbox © OpenStreetMap © DigitalGlobe'
});

// base maps
var NRbaseMaps = {
    'Terrain': NRmapboxTerrain,
    'Satellite' : NRmapboxSatellite
};

// setup overlay maps and controls
var NRoverlayMaps = {};

var NRlayerControl = L.control.layers(NRbaseMaps, NRoverlayMaps, {'position':'topright'}).addTo(newReportMap);

// tie to modal display
$('#newReportModal').on('shown.bs.modal', function() {
    _.defer(newReportMap.invalidateSize.bind(newReportMap));
});

$('#newReportModal').on('hidden.bs.modal', function() {
    //could call the cleanupForNewReport here
});


/**
 * refresh event page to show the details of the new report
 * @function refreshEventPage
 */
var refreshEventPage = function() {
    var saveCookies = {'- access': Cookies.get('- access'),
        '- needs': Cookies.get('- needs'),
        '- security': Cookies.get('- security'),
        '- contacts': Cookies.get('- contacts')};

    mainMap.removeLayer(accessLayer);
    layerControl.removeLayer(accessLayer);
    mainMap.removeLayer(needsLayer);
    layerControl.removeLayer(needsLayer);
    mainMap.removeLayer(securityLayer);
    layerControl.removeLayer(securityLayer);
    mainMap.removeLayer(contactsLayer);
    layerControl.removeLayer(contactsLayer);

    Object.keys(saveCookies).forEach(function(key) {
        Cookies.set(key,saveCookies[key]);
    });

    getReports(currentEventId, mainMap, mapReports);
};


// define what happens on click
newReportMap.on('click', function(e) {
    if(this.msf_marker)
        newReportMap.removeLayer(this.msf_marker);
    this.msf_latlng = e.latlng; // e is an event object (MouseEvent in this case)
    this.msf_marker = L.marker(e.latlng).addTo(newReportMap);
});

/**
 * post a new report
 * @function postReport
 * @param {integer} eventID - relevant event ID
 * @param {string} reportKey
 * @param {string} imgLink - optional url for uploaded report image
 */
function postReport(eventID,reportKey,imgLink) {
    var body = {
        'eventId': eventID,
        'status': 'unconfirmed',
        'created': new Date().toISOString(),
        'reportkey': reportKey,
        'location':newReportMap.msf_latlng,
        'content':{
            'report_tag': $('.rtype-selected').attr('data-msf-value'),
            'username/alias':$('#inputReportUserName').val(),
            'description':$('#inputReportText').val(),
            'image_link': imgLink
        }
    };

    $.ajax({
        type: 'POST',
        url: '/api/reports',
        data: JSON.stringify(body),
        contentType: 'application/json'
    }).done(function( data, textStatus, req ) {
        if (currentEventProperties) {
            // on event page, so
            refreshEventPage(); // to pick up the new report
        }
        $('#divProgress').html('Report submitted!');
        $('#divSuccess').show(500);
    }).fail(function (req, textStatus, err){
        if (currentEventProperties) { // on events page report modal
            alert('An error occured' + err);
        } else {
            $('#divProgress').html('An error occured');
        }
    });
}

// create a report on click:
$('#createReport').on('click', function (e) {
    var eventId, reportKey;

    if (currentEventProperties) { // we are in events page report modal
        eventId = currentEventProperties.id;
        reportKey = currentEventProperties.reportkey;
    } else { // on report card, get these from URL query params
        eventId = getQueryVariable('eventId');
        reportKey = getQueryVariable('reportkey');
    }

    if ((!eventId)||(!reportKey))
    {
        alert('EventId and/or reportKey missing. Please verify and try again.');
    }

    var imgLink='';

    if (newReportMap.msf_latlng !== null ) {
        $('#divProgress').html('Submitting your report...');
        var files=document.getElementById('inputImageUpload').files;

        if (files && files[0])
        {
            var imgFileName=files[0].name;
            var fileType=files[0].type;
            var photo=files[0];
            $.ajax({
                url : '../api/utils/uploadurl',
                data: 'filename='+imgFileName,// + '&mime=' + fileType,
                type : 'GET',
                dataType : 'json',
                cache : false,
            })
                .then(function(retData) {
                    imgLink=retData.url;
                    return $.ajax({
                        url : retData.signedRequest,
                        type : 'PUT',
                        data : photo,
                        dataType : 'text',
                        cache : false,
                        //contentType : file.type,
                        processData : false,
                    });
                }).then(function(data,txt,jq){

                    postReport(eventId,reportKey,imgLink);
                })
                .fail(function(err){
                    //$('#statusFile'+this.sssFileNo).html(glbFailedHTML+' failed to upload '+this.sssFileName+' <br>');
                    $('#divProgress').html('An error ' + err + ' occured while uploading the photo.');
                });

        }else {//no image just submit the report
            postReport(eventId,reportKey,imgLink);
        }//else


    }
});
