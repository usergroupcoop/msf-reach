/*
 * model.js - database models for CogniCity MSF Server missions data
 */

// Import promise support
import Promise from 'bluebird';

export default (config, db, logger) => ({

    /**
    * Return contacts
    * @function all - returns contacts, optionally filtered by string
    * @param {string} search - optional string search against name, email, phone numbers, employer, or speciality
    * @param {string} msf_associate - optional "true"/"false" to search for msf_associates or not
    * @param {string} msf_peer - ditto, for msf peers
    * @param {string} type - category of contact to filter on
    */
    all: (search,bounds,msf_associate,msf_peer,type) => new Promise((resolve, reject) => {
        // Setup query
        let query = `SELECT id, properties, the_geom
     FROM ${config.TABLE_CONTACTS}
     WHERE ($1 IS NULL OR (
      properties ->> 'name' ILIKE $1
      OR properties ->> 'cell' ILIKE $1
      OR properties ->> 'home' ILIKE $1
      OR properties ->> 'work' ILIKE $1
      OR properties ->> 'fax' ILIKE $1
      OR properties ->> 'employer' ILIKE $1
      OR properties ->> 'email' ILIKE $1
      OR properties ->> 'email2' ILIKE $1
      OR properties ->> 'speciality' ILIKE $1)) AND
      ($2 IS NULL OR ( the_geom && ST_MakeEnvelope($3,$4,$5,$6, 4326) ) ) AND
      ($7 IS NULL OR properties ->> 'msf_associate' ILIKE $7) AND
      ($8 IS NULL OR properties ->> 'msf_peer' ILIKE $8) AND
      ($9 IS NULL OR properties ->> 'type' ILIKE $9)
     ORDER BY id`;

        // Format search string for Postgres
        let text = (!search) ? null : '%'+search+'%'	;
        let hasBounds= (bounds.xmin && bounds.ymin && bounds.xmax && bounds.ymax);
        let values = [ text, hasBounds, bounds.xmin,bounds.ymin,bounds.xmax, bounds.ymax, msf_associate, msf_peer, type ];

        // Execute
        db.any(query, values).timeout(config.PGTIMEOUT)
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    }),

    /**
     * get an individual contact
     * @function byId
     * @param {integer} id - id of contact
     */

    byId: (id) => new Promise((resolve, reject) => {
        // Setup query
        let query = `SELECT id, created_at, updated_at, last_email_sent_at, properties, the_geom
     FROM ${config.TABLE_CONTACTS}
     WHERE id = $1`;

        // Format search string for Postgres
        let values = [ id ];

        // Execute
        db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
            .then((data) => resolve(data))
            .catch((err) => reject(err));
    }),

    /**
    * Create a new contact
    * @param {object} body Body of request with contact details
    */
    createContact: (body) => new Promise((resolve, reject) => {

        // Setup query
        let query = `INSERT INTO ${config.TABLE_CONTACTS}
     (created_at, properties, the_geom)
     VALUES (now(), $1, ST_SetSRID(ST_Point($2,$3),4326))
     RETURNING id, created_at, updated_at, last_email_sent_at, properties,
     the_geom`;

        // Setup values
        let values = [ body.properties, body.location.lng, body.location.lat ];

        // Execute
        logger.debug(query, values);
        db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
            .then((data) => resolve({ id: data.id, created_at:data.created_at,
                updated_at:data.updated_at, last_email_sent_at:data.last_email_sent_at,
                properties:data.properties, the_geom:data.the_geom }))
            .catch((err) => reject(err));
    }),

    /**
    * Update a contact
    * @param {integer} id ID of contact
    * @param {object} body Body of request with contact details
    */
    updateContact: (id, body) => new Promise((resolve, reject) => {

        // Setup query
        let query = `UPDATE ${config.TABLE_CONTACTS}
   SET properties = properties || $1, updated_at = now()
   WHERE id = $2
   RETURNING  created_at, updated_at, last_email_sent_at, properties,
   the_geom`;

        // Setup values
        let values = [ body.properties, id ];

        // Execute
        logger.debug(query, values);
        db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
        // TODO - why is id forced to a String()?
            .then((data) => resolve({ id: String(id), created_at:data.created_at,
                updated_at:data.updated_at, last_email_sent_at:data.last_email_sent_at,
                properties:data.properties, the_geom:data.the_geom }))
            .catch((err) => reject(err));
    }),

    /**
    * Set a contact's last email sent value to now
    * @param {integer} id ID of contact
    * @param {object} body Body of request with date object
    */
    setLastEmailTime: (id, body) => new Promise((resolve, reject) => {

    // Setup query
        let query = `UPDATE ${config.TABLE_CONTACTS}
     SET last_email_sent_at = $2
     WHERE id = $1
     RETURNING  created_at, updated_at, last_email_sent_at, properties,
     the_geom`;

        // Setup values
        let values = [ id, body.date ];

        // Execute
        logger.debug(query, values);
        db.oneOrNone(query, values).timeout(config.PGTIMEOUT)
            .then((data) => resolve({ id: String(id), created_at:data.created_at,
                updated_at:data.updated_at, last_email_sent_at:data.last_email_sent_at,
                properties:data.properties, the_geom:data.the_geom }))
            .catch((err) => reject(err));
    })
});
