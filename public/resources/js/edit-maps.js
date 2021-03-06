/*eslint no-unused-vars: off*/

var eventsLayer;

/**
* Function to map and print a table of events
* @param {Object} events - GeoJSON Object containing event details
*/
var mapEditEvents = function(err, events){

    // Add popups
    function onEachFeature(feature, layer) {
        var affectedPopulationStr = '';
        if (typeof(feature.properties.metadata.population_affected) !== 'undefined' && feature.properties.metadata.population_affected !== '') {
            affectedPopulationStr = 'Population affected: ' + feature.properties.metadata.population_affected + '<br>';
        }

        var totalPopulationStr = '';
        if (typeof(feature.properties.metadata.population_total) !== 'undefined' && feature.properties.metadata.population_total !== '') {
            totalPopulationStr = 'Total population: ' + feature.properties.metadata.population_total + '<br>';
        }

        var notificationStr = '';
        var statusStr = '';
        if(typeof(feature.properties.metadata.notification)!=='undefined' && feature.properties.metadata.notification.length > 0) {
            notificationStr = 'Latest notification: ' + feature.properties.metadata.notification[feature.properties.metadata.notification.length-1].notification + '<br>';
        } else {
            notificationStr = 'Latest notification: (none)<br>';
        }
        if(typeof(feature.properties.metadata.event_status)!=='undefined') {
            statusStr = 'Status: ' + feature.properties.metadata.event_status + '<br>';
        } else {
            statusStr = 'Status: ' + feature.properties.status + '<br>';
        }

        var severityStr = '';

        if (feature.properties.metadata.hasOwnProperty('severity')) {
            severityStr += 'Severity description: ' + feature.properties.metadata.severity + '<br>';
        }
        if (feature.properties.metadata.hasOwnProperty('severity_scale')) {
            severityStr += 'Severity scale: ' + severityLabels[feature.properties.metadata.severity_scale-1] + '<br>';
        }


        var type = feature.properties.metadata.sub_type != '' ? feature.properties.type + ',' + feature.properties.metadata.sub_type : feature.properties.type;
        var icon_name = type.includes(',') ? type.split(',')[0] : type;
        if (feature.properties.type.toLowerCase().includes('epidemiological')) {
            icon_name = 'epidemic';
        }

        var popupContent = '<a href=\'/events/?eventId=' + feature.properties.id +
    '\'><img src=\'/resources/images/icons/event_types/'+icon_name+'.svg\' width=\'40\'></a>' +
    '<strong><a href=\'/events/?eventId=' + feature.properties.id +
    '\'>' + feature.properties.metadata.name +'</a></strong>' + '<BR>' +
    'Opened: ' + (feature.properties.metadata.event_datetime || feature.properties.created_at) + '<BR>' +
    'Last updated at: ' + feature.properties.updated_at.split('T')[0] + '<br>' +
    'Type(s): ' + typeStr(feature.properties.type,feature.properties.metadata.sub_type) + '<br>' +
    statusStr +
    severityStr +
    notificationStr +
    totalPopulationStr +
    affectedPopulationStr;


        if (popupContent.endsWith('<br>')) {
            popupContent.substr(0,popupContent.length-4);
        }


        if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
        }

        layer.bindPopup(popupContent);
    }

    eventEventsLayer = L.geoJSON(events, {
        pointToLayer: function (feature, latlng) {
            if (feature.properties.id!==currentEventId) {
                return L.marker(latlng, {icon: L.icon({
                    iconUrl: '/resources/images/icons/event_types/open_event.svg',
                    iconSize:     [50, 50], // size of the icon
                    iconAnchor: [25, 50],
                    popupAnchor: [0, -40]
                    //iconAnchor:   [13, -13], // point of the icon which will correspond to marker's location
                    //popupAnchor:  [13, 13] // point from which the popup should open relative to the iconAnchor
                })});
            } else {
                return null;
            }
        },
        onEachFeature: onEachFeature
    });

    msfResponseEventsLayer = L.geoJSON(events, {
        pointToLayer: function (feature, latlng) {
            if (feature.properties.id!==currentEventId) {
                return L.marker(latlng, {icon: L.icon({
                    iconUrl: '/resources/images/icons/event_types/open_event.svg',
                    iconSize:     [50, 50], // size of the icon
                    iconAnchor: [25, 50],
                    popupAnchor: [0, -40]
                    //iconAnchor:   [13, -13], // point of the icon which will correspond to marker's location
                    //popupAnchor:  [13, 13] // point from which the popup should open relative to the iconAnchor
                })});
            } else {
                return null;
            }
        },
        onEachFeature: onEachFeature
    });

    if (Cookies.get('Ongoing MSF Projects')==='on') {
        eventEventsLayer.addTo(eventMap);
        msfResponseEventsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(eventEventsLayer, 'Ongoing MSF Projects');
    msfResponseMapLayerControl.addOverlay(msfResponseEventsLayer, 'Ongoing MSF Projects');

};

/**
* Function to add missions to map
* @param {Object} missions - GeoJson FeatureCollection containing mission points
**/
var mapEditMissions = function(missions ){

    function onEachFeature(feature, layer) {

        var popupContent = '';

        if (feature.properties && feature.properties.properties) {
            popupContent += '<a href="#" data-toggle="modal" data-target="#missionModal" onclick="onMissionLinkClick(' +
        feature.properties.id +
        ')">' + missionPopupIcon(feature.properties.properties.type) + '</a>';
            popupContent += '<a href="#" data-toggle="modal" data-target="#missionModal" onclick="onMissionLinkClick(' +
        feature.properties.id +
        ')">' + feature.properties.properties.name + '</a><br>';
            if (typeof(feature.properties.properties.notification) !== 'undefined' && feature.properties.properties.notification.length > 0){
                popupContent += 'Latest notification: ' + feature.properties.properties.notification[feature.properties.properties.notification.length-1].notification + '<BR>';
            } else {
                popupContent += 'Latest notification: (none)<BR>';
            }
            popupContent += 'Start date: ' + feature.properties.properties.startDate + '<BR>';
            popupContent += 'Finish date: ' + feature.properties.properties.finishDate + '<BR>';
            popupContent += 'Managing OC: ' + feature.properties.properties.managingOC + '<BR>';
            popupContent += 'Severity: ' + feature.properties.properties.severity + '<BR>';
            popupContent += 'Capacity: ' + feature.properties.properties.capacity + '<BR>';
        }

        layer.bindPopup(popupContent);
    }

    // MSF Icons
    var missionIcon = L.icon({
        iconUrl: '/resources/images/icons/event_types/historical.svg',

        iconSize:     [50, 50], // size of the icon
        opacity: 0.8,
        iconAnchor:   [25, 50], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
    });

    var eventMissionsLayer = L.geoJSON(missions, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: missionIcon});
        },
        onEachFeature: onEachFeature
    });

    var msfResponseMissionsLayer = L.geoJSON(missions, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: missionIcon});
        },
        onEachFeature: onEachFeature
    });

    if (Cookies.get('Mission Histories')==='on') {
        eventMissionsLayer.addTo(eventMap);
        msfResponseMissionsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(eventMissionsLayer, 'Mission Histories');
    msfResponseMapLayerControl.addOverlay(msfResponseMissionsLayer, 'Mission Histories');

};


/**
* Function to add contacts to map
* @param {Object} contacts - GeoJson FeatureCollection containing contact points
**/
var mapEditContacts = function(contacts ){

    function onEachFeature(feature, layer) {

        var popupContent = '';

        if (feature.properties && feature.properties.properties) {
            popupContent = 'Full name: <a href="#" onclick="onContactLinkClick(' +
        feature.properties.id +
        ')" data-toggle="modal" data-target="#contactDetailsModal">' +
      (typeof(feature.properties.properties.title)==='undefined' ? '' : feature.properties.properties.title) + ' ' + feature.properties.properties.name + '</a>' +
      '<br>Email address: '+(typeof(feature.properties.properties.email)==='undefined' ? '' : '<a href="mailto:'+feature.properties.properties.email+'">'+feature.properties.properties.email+'</a>') +
      '<br>Mobile: '+(typeof(feature.properties.properties.cell)==='undefined' ? '' : feature.properties.properties.cell) +
      '<br>Type of contact: '+(typeof(feature.properties.properties.type)==='undefined' ? '' : feature.properties.properties.type) +
      '<br>Speciality: '+(typeof(feature.properties.properties.speciality)==='undefined' ? '' : feature.properties.properties.speciality);
        }

        layer.bindPopup(popupContent);
    }

    // function returns list of msf staff contacts if msf is true, else other contacts
    function msfContact(contacts, msf) {

        var newFC = {features: []};
        for(var i = 0; i < contacts.features.length; i++) {

            if(contacts.features[i].properties.properties.hasOwnProperty('type') && contacts.features[i].properties.properties.type === 'Current MSF Staff' || contacts.features[i].properties.properties.type.toUpperCase().includes('MSF') && !contacts.features[i].properties.properties.type.toLowerCase().includes('peer')) {
                if (msf) {
                    newFC.features.push(contacts.features[i]);
                }
            } else if (!msf) {
                newFC.features.push(contacts.features[i]);
            }
        }
        return newFC;
    }

    // MSF Icons
    var contactIcon = L.icon({
        iconUrl: '/resources/images/icons/contacts/Contact_Red-42.svg',

        iconSize:     [36, 36], // size of the icon
    //iconAnchor:   [13, -13], // point of the icon which will correspond to marker's location
    //popupAnchor:  [13, 13] // point from which the popup should open relative to the iconAnchor
    });

    var eventMSFContactsLayer = L.geoJSON(msfContact(contacts,true), {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: contactIcon});
        },
        onEachFeature: onEachFeature
    });

    var eventNonMSFContactsLayer = L.geoJSON(msfContact(contacts,false), {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: contactIcon});
        },
        onEachFeature: onEachFeature
    });

    var msfResponseMSFContactsLayer = L.geoJSON(msfContact(contacts,true), {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: contactIcon});
        },
        onEachFeature: onEachFeature
    });

    var msfResponseNonMSFContactsLayer = L.geoJSON(msfContact(contacts,false), {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: contactIcon});
        },
        onEachFeature: onEachFeature
    });

    if (Cookies.get('- MSF Staff')==='on') {
        eventMSFContactsLayer.addTo(eventMap);
        msfResponseMSFContactsLayer.addTo(msfResponseMap);
    }
    if (Cookies.get('- other contacts')==='on') {
        eventNonMSFContactsLayer.addTo(eventMap);
        msfResponseNonMSFContactsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(eventMSFContactsLayer, '- MSF Staff', 'Contacts');
    eventMapLayerControl.addOverlay(eventNonMSFContactsLayer, '- other contacts', 'Contacts');

    msfResponseMapLayerControl.addOverlay(msfResponseMSFContactsLayer, '- MSF Staff', 'Contacts');
    msfResponseMapLayerControl.addOverlay(msfResponseNonMSFContactsLayer, '- other contacts', 'Contacts');


};


var mapEditPDCHazards = function(hazards){

    eventPDCHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: PDCHazardIcon(feature.properties.summary)});
        },
        onEachFeature: hazardFeature
    });

    msfResponsePDCHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: PDCHazardIcon(feature.properties.summary)});
        },
        onEachFeature: hazardFeature
    });

    if (Cookies.get('- PDC')==='on') {
        PDCHazardsLayer.addTo(eventMap);
        PDCHazardsLayer.addTo(msfResponseMap);
    }

    eventMapLayerControl.addOverlay(eventPDCHazardsLayer, '- PDC', 'RSS Feeds');
    msfResponseMapLayerControl.addOverlay(msfResponsePDCHazardsLayer, '- PDC', 'RSS Feeds');


};

var mapEditTSRHazards = function(hazards){

    eventTSRHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, L.icon({
                iconUrl: '/resources/images/icons/event_types/typhoon.svg',
                iconSize: [39, 39]
            }));
        },
        onEachFeature: hazardFeature
    });

    msfResponseTSRHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, L.icon({
                iconUrl: '/resources/images/icons/event_types/typhoon.svg',
                iconSize: [39, 39]
            }));
        },
        onEachFeature: hazardFeature
    });

    if (Cookies.get('- TSR')==='on') {
        eventTSRHazardsLayer.addTo(eventMap);
        msfResponseTSRHazardsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(eventTSRHazardsLayer, '- TSR', 'RSS Feeds');
    msfResponseMapLayerControl.addOverlay(msfResponseTSRHazardsLayer, '- TSR', 'RSS Feeds');


};

/*
* Function to add PTWC hazards to map
* @param {Object} hazards - GeoJson FeatureCollection containing PTWC hazard points
**/
var mapEditPTWCHazards = function(hazards){
    eventPTWCHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, L.icon({
                iconUrl: '/resources/images/icons/event_types/tsunami.svg',
                iconSize: [39, 39]
            }));
        },
        onEachFeature: hazardFeature
    });

    msfResponsePTWCHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, L.icon({
                iconUrl: '/resources/images/icons/event_types/tsunami.svg',
                iconSize: [39, 39]
            }));
        },
        onEachFeature: hazardFeature
    });

    if (Cookies.get('- PTWC')==='on') {
        eventPTWCHazardsLayer.addTo(eventMap);
        msfResponsePTWCHazardsLayer.addTo(msfResponseMap);
    }

    eventMapLayerControl.addOverlay(eventPTWCHazardsLayer, '- PTWC', 'RSS Feeds');
    msfResponseMapLayerControl.addOverlay(msfResponsePTWCHazardsLayer, '- PTWC', 'RSS Feeds');

};

/*
* Function to add GDACS hazards to map
* @param {Object} hazards - GeoJson FeatureCollection containing GDACS hazard points
**/
var mapEditGDACSHazards = function(hazards){
    eventGDACSHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: GDACSHazardIcon(feature.properties)});
        },
        onEachFeature: hazardFeature
    });

    msfResponseGDACSHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {icon: GDACSHazardIcon(feature.properties)});
        },
        onEachFeature: hazardFeature
    });

    if (Cookies.get('- GDACS')==='on') {
        eventGDACSHazardsLayer.addTo(eventMap);
        msfResponseGDACSHazardsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(eventGDACSHazardsLayer, '- GDACS', 'RSS Feeds');
    msfResponseMapLayerControl.addOverlay(msfResponseGDACSHazardsLayer, '- GDACS', 'RSS Feeds');

};

/*
* Function to add USGS hazards to map
* @param {Object} hazards - GeoJson FeatureCollection containing USGS hazard points
**/
var mapEditUSGSHazards = function(hazards){

    USGSHazardsLayer = L.geoJSON(hazards, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, L.icon({
                iconUrl: '/resources/images/icons/event_types/earthquake.svg',
                iconSize: [39, 39]
            }));
        },
        onEachFeature: hazardFeature
    });

    if (Cookies.get('- USGS')==='on') {
        USGSHazardsLayer.addTo(eventMap);
        USGSHazardsLayer.addTo(msfResponseMap);
    }
    eventMapLayerControl.addOverlay(USGSHazardsLayer, '- USGS', 'RSS Feeds');
    msfResponseMapLayerControl.addOverlay(USGSHazardsLayer, '- USGS', 'RSS Feeds');

};


var latlng;
