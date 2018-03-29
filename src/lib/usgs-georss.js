import Promise from 'bluebird';

import { parseString } from 'xml2js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { inAsiaBBox } from './util.js';

/**
 * tidy up the summary data using cheerio library
 * @function tidySummary
 * @param {string} summary data
 */
var tidySummary = function(summary) {
    var $ = cheerio.load(summary);
    return '<br>Time: ' + $('dt').next().html() + ' (' +
    $('dt').next().next().html() + ')<br>' +
    'Depth: ' + $('dt').next().next().next().next().next().next().html();
};

// Take US Geological Survey atom (rss) data and return geojson with required properties.

const USGS = () =>
    new Promise((resolve, reject) => {
        var options = {
            uri:
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.atom',
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
                let title = result.feed.title[0];
                let features = []; // store for features
                if (result.feed.entry) {
                    for (let i = 0; i < result.feed.entry.length; i++) {
                        let event = result.feed.entry[i];
                        if (event['georss:point']) {
                            // define a feature
                            let feature = {
                                type: 'Feature',
                                geometry: { type: 'Point', coordinates: [] },
                                properties: {}
                            };
                            // extract coords
                            let coords = event['georss:point'][0].split(' ');
                            if (inAsiaBBox(coords)) {
                                feature.geometry.coordinates.push(JSON.parse(coords[1]));
                                feature.geometry.coordinates.push(JSON.parse(coords[0]));
                                // extract properties
                                feature.properties.source = 'United States Geological Survey';
                                feature.properties.title = 'Earthquake - ' + event.title[0];
                                feature.properties.link = event.link[0].$.href;
                                feature.properties.id = 'USGS-'+event.id[0];
                                feature.properties.updated = event.updated[0];
                                feature.properties.summary = tidySummary(event.summary[0]._.trim());

                                // push feature to feature collection
                                features.push(feature);
                            }
                        }
                    }
                }
                // return GeoJSON
                resolve({ type: 'FeatureCollection', title: title, features: features });
            })
            .catch(function(err) {
                reject(err);
            });
    });

module.exports = { USGS };
