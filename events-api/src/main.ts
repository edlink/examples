import * as dotenv from 'dotenv';
import axios from 'axios';

// Add environment variables from our local .env file to process.env
dotenv.config({ path: `${__dirname}/../../.env` });

const header_config = {
    headers: {
        authorization: `Bearer ${process.env.sample_integration_access_token}`
    }
};

type EventsByEntity = Record<
    string,
    {
        created: any[];
        updated: any[];
        deleted: string[];
    }
>;

/**
 * This file demonstrates how to query the Edlink Events API, which allows you to
 * sync only new changes to the dataset (since a given past event).
 */
(async () => {
    // Fill this in with the UUID of the last processed event.
    const last_processed_event = '00000000-0000-0000-0000-000000000000';

    // Retrieve the latest events.
    const events_response = await axios.get(
        `https://ed.link/api/v2/graph/events?$after=${last_processed_event}`,
        header_config
    );

    console.log(events_response.data);

    const entity_types = [
        'district',
        'school',
        'session',
        'course',
        'person',
        'class',
        'section',
        'enrollment',
        'agent'
    ];
    const events_by_entity_type: EventsByEntity = {};

    for (const entity of entity_types) {
        events_by_entity_type[entity] = {
            created: [],
            updated: [],
            deleted: []
        };
    }

    // Sort the events by entity and by create/update/delete operation type.
    for (const event of events_response.data.$data) {
        if (event.type === 'deleted') {
            events_by_entity_type[event.target].deleted.push(event.target_id);
        } else if (event.type === 'updated' || event.type === 'created') {
            events_by_entity_type[event.target][event.type].push(event.data);
        }
    }

    // Afterwards, loop over this data structure and write the updates to the database.
    for (const [entity_type, changes] of Object.entries(events_by_entity_type)) {
        // Write new entity creations to the database by ID.
        // Write entity updates to the database by ID.
        // Delete removed entities from the database by ID.
    }

    console.log('Done processing events!');
})();
