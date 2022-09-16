import axios from 'axios';

const header_config = {
    headers: {
        authorization: `Bearer [integration access token goes here]`
    }
};

/**
 * This file demonstrates how to query the Edlink Events API, which allows you to
 * sync only new changes to the dataset (since a given past event).
 */
async function loadNewDeltas() {
    // Fill this in with the UUID of the last processed event.
    let last_processed_event_id = await loadLastEventID();

    // This field will hold the url for our next request
    let url = `https://ed.link/api/v2/graph/events?$first=10000&$after=${last_processed_event_id}`;

    // Loop through each page of the results
    while (url) {
        const result = await axios.get(url, header_config).then((res) => res.data);

        for (const event of result.$data) {
            // Write a function to process events as they come in
            await updateDatabase(event);
            last_processed_event_id = event.id;
        }
        url = result.$next;
    }

    // Finally, store the last processed event ID in the database, for usage on next run
    storeLastEventID(last_processed_event_id);
}

async function saveLastSeenEvent() {
    const last_seen_event = await axios
        .get('https://ed.link/api/v2/graph/events?$last=1', header_config)
        .then((res) => res.data);
    storeLastEventID(last_seen_event);
}

async function updateDatabase(event) {}
async function loadLastEventID() {}
async function storeLastEventID(last_processed_event_id) {}
