import Promise from 'bluebird';

import {parseString} from 'xml2js';
import rp from 'request-promise';

import { inAsiaBBox } from './util.js';

// Take Pacific Disaster Center georss data and return geojson with required properties.

const PDC = () => new Promise((resolve, reject) => {

    var options = {
        uri: 'http://d2mxabrykbl1km.cloudfront.net/feed.xml',
        transform: function(body) {
            return new Promise(resolve => {
                parseString(body, function(err, result) {
                    if (err) result(err); // handle errors
                    resolve(result);
                });
            });
        }
    };

    rp(options)
        .then(function(result) {
            let features = []; // store for features
            if (result.feed.entry) {
                for (let i = 0; i < result.feed.entry.length; i++){
                    let event = result.feed.entry[i];
                    if (event['georss:point']){
                        // define a feature
                        let feature = {'type': 'Feature', 'geometry':{'type':'Point','coordinates':[]},'properties':{}};
                        // extract coords
                        let coords = event['georss:point'][0].split(' ');
                        if (inAsiaBBox(coords)) {
                            feature.geometry.coordinates.push(JSON.parse(coords[1]));
                            feature.geometry.coordinates.push(JSON.parse(coords[0]));
                            // extract properties
                            feature.properties.source = 'Pacific Disaster Center';
                            feature.properties.title = event.title[0];
                            feature.properties.link = event.link[0].$.href;
                            feature.properties.id = 'PDC-'+event.id[0];
                            feature.properties.updated = event.updated[0];
                            feature.properties.summary = event.summary[0];
                            // push feature to feature collection
                            features.push(feature);
                        }
                    }
                }
            }
            // return GeoJSON
            resolve({'type':'FeatureCollection','features':features});
        }).catch(function(err) {
            reject(err);
        });
});

module.exports = { PDC };
