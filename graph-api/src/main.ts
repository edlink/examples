/**
 * This file demonstrates how to query each of the Edlink Graph API entity endpoints
 * and retrieve a full copy of the source dataset, which can then be written to
 * a database and saved / queried.
 * 
 * The only variable that you need to fill in is ths the integration access token,
 * which you can find on your Edlink dashboard, or programmatically via our API.
 * See the developer guide on "Configuring Integrations via API" for more details.
 * 
 * We use the axios library to make HTTP requests, but you can use any library.
 */

import axios from 'axios';

const header_config = {
    headers: {
        authorization: `Bearer [integration access token goes here]`
    }
};

const entity_types = [
    'districts',
    'schools',
    'sessions',
    'courses',
    'people',
    'classes',
    'sections',
    'enrollments',
    'agents'
];

async function loadSourceDataset() {
    const source_dataset = {
        districts: [],
        schools: [],
        sessions: [],
        courses: [],
        people: [],
        classes: [],
        sections: [],
        enrollments: [],
        agents: []
    };

    for (const entity_type of entity_types) {
        // This is our initial request to the API. Note the $first parameter, which indicates both the order and quantity of results.
        let url = `https://ed.link/api/v2/graph/${entity_type}?$first=1000`;

        while(url) {
            const { $data, $next } = await axios.get(url, header_config)
                .then((response) => response.data);

                for (const entity of $data) {
                    source_dataset[entity_type].push(entity);
                }

            // Edlink will respond with a cursor to the next page of results, if there are any.
            // If this is the last page, $next will be null and this loop will terminate.
            url = $next;
        }
    }

    // At this point, we will have the whole dataset in memory. We can now write it to a database, or do whatever else we need to do.
    writeToDB(source_dataset);
}

async function writeToDB(source_dataset) {
    // This function you'll want to implement on your own.
    // It should perform creates, updates, and deletes on your database (or something similar).
}

loadSourceDataset();