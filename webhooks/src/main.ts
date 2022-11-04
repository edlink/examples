/**
 * This file demonstrates how to implement a simple endpoint that can receive
 * Edlink Webhook API events. Webhooks can be used to have your application
 * receive immediate notifications whenever common events happen in Edlink,
 * such as when a user logins in or when new data is available.
 *
 * More information on Edlink webhooks can be found in the docs.
 */
import crypto from 'crypto';
import express from 'express';
const app = express();

// Enable a middleware for parsing incoming JSON
app.use(express.json({
    verify: (req, res, buf) => {
        // @ts-expect-error
        req.rawBody = buf.toString()
    }
}));

const WEBHOOK_SECRET = "WEBHOOK_SECRET_GOES_HERE";

/**
 * Parse the Edlink-Signature header, which is in the format:
 * Edlink-Signature: t=1353492033,v0=01552d8e848e021280b9d71e331a0fcc898294b4d16b23edb7a6b11f87ff7a8c
 *
 * Combine the timestamp and the request body contents together, hash them, and check
 * if the result is equal to the provided signature.
 */
function validateSignature(header, raw_request_body) {

    const [timestamp_val, signature_val] = header.split(",");
    const timestamp = timestamp_val.split("t=")[1];
    const signature = signature_val.split("v0=")[1];

    const content = `${timestamp}.${raw_request_body}`;
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(content, 'utf8').digest('hex');

    return hash === signature;
}

// Listen on the route /edlink_webhooks for incoming POST requests
app.post('/webhooks', (req, res) => {

    // @ts-expect-error
    // Ensure that the request is coming from Edlink by validating the Edlink-Signature header
    if(!validateSignature(req.headers['edlink-signature'], req.rawBody)) {
        return res.status(404).end();
    }

    // Parse the request data
    const events = req.body.$events;
    for(const event of events) {
        const { type, payload } = event;

        // Process the event here, based on the event type
    }

    // Return a 200 response when finished
    return res.status(200).end();
});

app.get('/', (req, res) => {
    return res.status(200).json({"what": 123})
})

// Listen on port 3000
app.listen(3000);
