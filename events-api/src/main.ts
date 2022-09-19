/**
 * This file demonstrates how to query the Edlink Events API, which allows you to
 * sync only new changes to the dataset (since a given past event).
 * 
 * The only variable that you need to fill in is ths the integration access token,
 * which you can find on your Edlink dashboard, or programmatically via our API.
 * See the developer guide on "Configuring Integrations via API" for more details.
 *
 * When running a sync using the Events API for the first time, you should:
 * 1. Retrieve the last existing event ID, using the saveLastSeenEvent function below, and save it to database.
 * 2. Run a full sync (sample code in the graph-api folder).
 * 3. Set up a cron script to execute the following function every hour.
 * 4. At the end of the loadNewDeltas function, save the last processed event ID to the database.
 * 
 * We use the axios library to make HTTP requests, but you can use any library.
 */

import axios from 'axios';

const header_config = {
    headers: {
        authorization: `Bearer [integration access token goes here]`
    }

};

// This will be your implementation of storing the last seen event ID in your database.
async function storeLastEventID(event_id) {}

// This will be your implementation of loading the last seen event ID from your database.
async function retrieveLastEventID() {}

// This function will receive an event and apply the change to your database.
async function updateDatabase(event) {}

// This function is implemented in the `graph-api` folder of this examples repo.
// It does a full sync of the dataset, which we recommend doing once before running the events API.
async function loadSourceDataset() {}

// Load any event deltas from Edlink since the last processed ID.
// This function should be executed periodically, e.g. every hour.
async function loadNewDeltas() {
    // Retrieve the UUID of the last processed event.
    let last_processed_event_id = await retrieveLastEventID();

    // This field will hold the url for our next request
    let url = `https://ed.link/api/v2/graph/events?$first=10000&$after=${last_processed_event_id}`;

    // Loop through each page of the results
    while (url) {
        const { $data, $next } = await axios.get(url, header_config).then((res) => res.data);

        for (const event of $data) {
            // Write a function to process events as they come in
            await updateDatabase(event);

            // Keep track of the last ID that we've seen / processed.
            last_processed_event_id = event.id;
        }

        // Edlink will respond with a cursor to the next page of results, if there are any.
        url = $next;
    }

    // Finally, store the last processed event ID in the database, for usage on next run.
    await storeLastEventID(last_processed_event_id);
}

async function saveLastSeenEvent() {
    const { $data } = await axios.get('https://ed.link/api/v2/graph/events?$last=1', header_config).then((res) => res.data);

    // If there is a last event (there probably will be), save it to the database.
    if ($data.length > 0) {
        await storeLastEventID($data[0].id);
    }
}

async function runInitialSync(){
    // First, we wait to save the last event ID.
    await saveLastSeenEvent();

    // Then, we run a full sync using the example implementation in the graph-api folder.
    await loadSourceDataset();

    // Finally, we set an interval to check for new events every hour.
    setInterval(loadNewDeltas, 1000 * 60 * 60);
}

runInitialSync();