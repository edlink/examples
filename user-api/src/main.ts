import * as dotenv from 'dotenv';
import axios from 'axios';

// Add environment variables from our local .env file to process.env
dotenv.config({ path: `${__dirname}/../../.env` });

/**
 * This file demonstrates how to perform some basic operations with the Edlink User API,
 * which is used for retrieving information and performing LMS operations with the
 * access / visibility level and permissions of a particular end user.
 */
(async () => {
    // Convert the refresh token for a particular Person into an access token that we can use to query User API endpoints.
    const access_token_response = await axios.post('https://ed.link/api/authentication/token', {
        client_id: process.env.sample_client_id,
        client_secret: process.env.sample_client_secret,
        refresh_token: process.env.sample_user_refresh_token,
        grant_type: 'refresh_token'
    });
    const person_access_token = access_token_response.data.$data.access_token;
    const header_config = {
        headers: {
            authorization: `Bearer ${person_access_token}`
        }
    };

    // Retrieve this user's profile, containing their ID, name, email, phone, and other info.
    const profile_response = await axios.get(`https://ed.link/api/v2/my/profile`, header_config);
    console.log("User profile information:");
    console.log(profile_response.data.$data);

    // Retrieve the list of classes that this Person is enrolled in.
    const classes_response = await axios.get('https://ed.link/api/v2/my/classes', header_config);
    const enrolled_classes_list = classes_response.data.$data;

    console.log("User classes:");
    console.log(enrolled_classes_list);

    // Retrieve the list of assignments this Person has assigned to them, in each of their classes.
    for(const _class of enrolled_classes_list) {
        const assignments_response = await axios.get(`https://ed.link/api/v2/my/classes/${_class.id}/assignments`, header_config);

        console.log(`Assignments for this user in class ${_class.name}:`);
        console.log(assignments_response.data.$data);
    }
})();
