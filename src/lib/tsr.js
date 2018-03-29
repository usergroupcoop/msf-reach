import Promise from 'bluebird';

import cheerio from 'cheerio';
import rp from 'request-promise';
import { parseDms } from 'dms-conversion';
import { inAsiaBBox } from './util.js';

// scrape data from Tropical Storm Risk site and return geojson with desired properties

const TSR = () =>
    new Promise((resolve, reject) => {
        let HOST = 'http://www.tropicalstormrisk.com/tracker/dynamic';
        var options = {
            uri: `${HOST}/main_.html`,
            transform: function(body) {
                return cheerio.load(body);
            }
        };

        rp(options)
            .then(function($) {
                let features = []; // store for features

                var tr = $('table.wide tbody tr');
                if (tr.length >= 3) {
                    let updated = $(tr[1]).find('th').eq(0).text().trim();
                    for (var i = 3; i < tr.length; i++) {
                        let storm = $(tr[i]).find('td').eq(0).text().trim();
                        let basin = $(tr[i]).find('td').eq(1).text().trim();
                        let currentDataLat = $(tr[i]).find('td').eq(3).text().trim();
                        let currentDataLong = $(tr[i]).find('td').eq(4).text().trim();
                        let dmsStrings = [currentDataLat, currentDataLong];
                        let currentDataCoords = dmsStrings.map(parseDms);
                        let currentDataWind = $(tr[i]).find('td').eq(5).text().trim();
                        let currentDataCat = $(tr[i]).find('td').eq(6).text().trim();

                        // define a feature
                        let feature = {
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [] },
                            properties: {}
                        };

                        if (inAsiaBBox([currentDataCoords[1],currentDataCoords[0]])) {
                            // extract coords
                            feature.geometry.coordinates.push(currentDataCoords[1]);
                            feature.geometry.coordinates.push(currentDataCoords[0]);
                            // extract properties
                            feature.properties.source = 'Tropical Storm Risk';
                            feature.properties.title = 'Storm - ' + storm + ' in ' + basin;
                            let url = ($(tr[i]).find('td').eq(0).find('a').attr('href')).split('./');
                            feature.properties.link = HOST + '/' + url[1];
                            feature.properties.id = 'TSR-'+ url[1].split('.')[0];
                            feature.properties.updated = (new Date(updated)).toISOString();
                            feature.properties.summary = 'Wind: ' + currentDataWind + ' Category: ' + currentDataCat;

                            // push feature to feature collection
                            features.push(feature);
                        }
                    }
                }

                // return GeoJSON
                resolve({ type: 'FeatureCollection', features: features });
            })
            .catch(function(err) {
                reject(err);
            });
    });

module.exports = { TSR };
