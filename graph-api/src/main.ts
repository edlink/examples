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

/**
 * This file demonstrates how to query each of the Edlink Graph API entity endpoints
 * and retrieve a full copy of the source dataset, which can then be written to
 * a database and saved / queried.
 */
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

        let url = `https://ed.link/api/v2/graph/${entity_type}$first=10000`;
        while(url) {
            const response = await axios
                .get(`https://ed.link/api/v2/graph/${entity_type}$first=10000`, header_config)
                .then((response) => response.data);

                for (const entity of response.$data) {
                    source_dataset[entity_type].push(entity);
                }

            url = response.$next;
        }
    }

    writeToDB(source_dataset);
}

async function writeToDB(source_dataset) {
    // Perform creates, updates, and deletes on the database here.
}

loadSourceDataset();
