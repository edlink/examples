import express from 'express';

const app = express();

// Enable a middleware for parsing incoming JSON
app.use(express.json());

// Listen on the route /edlink_webhooks for incoming POST requests
app.post('/edlink_webhooks', (req, res) => {

    // Parse the request data
    const events = req.body.$events;
    for(const event of events) {
        const { type, payload } = event;

        // Process the event here, based on the event type
    }

    // Return a 200 response when finished
    res.status(200).end();
});

// Listen on port 3000
app.listen(3000);
