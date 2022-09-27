//Edlink Multiplexing Implementation example. The code below is very similar to the SSO implementation example. For detailed information on how the SSO code works, see https://github.com/edlink/examples/blob/master/sso/src/main.ts

//This page demonstrates how to route users to different webpages or subdomains based on what integration they access your application from.

import axios from 'axios';

import express from 'express';
const app = express();
const PORT = 3000;
const router = express.Router();

//your client id is also known as your application ID and can be found in the application page of the edlink dashboard
const client_id = '....';

//Client secret can be found on your application page in the edlink dashboard, next to the Client ID
const client_secret = '....';

//Found on your application page
const redirect_uri = '...';

router.get('/redirect', async function (req: any, res: any) {
    const { code } = req.query;

    console.log('in redirect');

    //This request will be the POST body for the authentication
    const request = {
        code,
        client_id,
        client_secret,
        redirect_uri,
        grant_type: 'authorization_code'
    };

    //the response variable will contain an access token and a refresh token in JSON form. The refresh token will expire one hour after accessing.
    const response = await axios.post('https://ed.link/api/authentication/token', request);

    //You can then use the access token or bearer token to reach protected endpoints such as the user profile, listed below
    const access_token = response.data.$data.access_token;

    //populate this array with your multiple integraion ids and the desired redirect locations of those integrations.
    const subdomains: { [index: string]: any } = {
        //'integration_id': 'destination URL'
        '...': 'https://houston.myapp.com', //integration_id_a
        '....': 'https://dallas.myapp.com', //integration_id_b
        '.....': 'https://austin.myapp.com' //integration_id_c
    };

    //this request will grab you information on the entire integration.
    const integration = await axios.get('https://ed.link/api/v2/my/integration', {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });

    //grab the integraion_id from the integration response object
    const integration_id = integration.data.$data.id;

    //check to see if the subdomains contains the fetched integration_id
    if (subdomains.hasOwnProperty(integration_id)) {
        // This is where you would attach query parameters, cookies, etc.

        //use the integration id to redirect to your webpage.
        res.redirect(subdomains[integration_id]);
    }
});

app.use(router);
app.listen(PORT, function () {
    // if (err) console.log(err);
    console.log('Server listening on PORT', PORT);
});
