import axios from 'axios';

/**
 * This file demonstrates how to perform some basic operations with the Edlink User API,
 * which is used for retrieving information and performing LMS operations with the
 * access / visibility level and permissions of a particular end user.
 */
async function retrieveUserAPIData() {
    // Convert the refresh token for a particular Person into an access token that we can use to query User API endpoints.
    const access_token_response = await axios.post('https://ed.link/api/authentication/token', {
        client_id: '[client ID goes here]',
        client_secret: '[client secret goes here]',
        refresh_token: '[user refresh token goes here]',
        grant_type: 'refresh_token'
    });
    const person_access_token = access_token_response.data.$data.access_token;
    const header_config = {
        headers: {
            authorization: `Bearer ${person_access_token}`
        }
    };

    // Retrieve this user's profile, containing their ID, name, email, phone, and other info.
    const profile_data = await axios
        .get(`https://ed.link/api/v2/my/profile`, header_config)
        .then((response) => response.data);

    // Retrieve the list of classes that this user is enrolled in.
    const enrolled_classes_list = await axios
        .get('https://ed.link/api/v2/my/classes', header_config)
        .then((response) => response.data);

    // Retrieve the list of assignments this user has assigned to them, in each of their classes.
    for (const _class of enrolled_classes_list.$data) {
        const assignments_response = await axios
            .get(`https://ed.link/api/v2/my/classes/${_class.id}/assignments`, header_config)
            .then((response) => response.data);
    }
}
