//Edlink SSO Implementation example. Refer to https://ed.link/docs/guides/v2.0/authorization and https://ed.link/docs/guides/v2.0/sso-launches for more.

// Import the axios package for the HTTP functions
const axios = require('axios');

//import crypto to generate random string 
const crypto = require('crypto');

//Using Express for the Router. Run 'yarn add express' or 'npm install express' to use
//the next few lines are setup for the express routing
const express = require('express');
const app = express();
const PORT = 3000;
const router = express.Router();

//your client id is also known as your application ID and can be found in the application page of the edlink dashboard
const client_id = '...';

//Client secret can be found on your application page in the edlink dashboard, next to the Client ID
const client_secret = '...';

//this is where edlink will send your users after a successful login. This URI must be explicitly specified in your application settings or it will not work.
const redirect_uri = '...';


router.get('/login', function (req: any, res: any) {
    //generate random string of size ten using crypto lib
    const state = crypto.randomBytes(10).toString('hex');

    //this is the final constructed URL
    //'encodeURIComponent' is here to format the URI for usage in the URL
    const sso_url_string = `https://ed.link/sso/login?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&state=${state}&response_type=code`;

    //this takes the /login page directly to the redirect_uri using the sso_url_string
    res.redirect(sso_url_string);
})

//this function is Asynchronous due to the await used in the post method below
router.get('/redirect', async function (req: any, res: any){
    //the code and state variables are read from the query parameters using req.query
    const { code, state } = req.query;

    //If you passed a state variable in the URL, you can check here to see if it has been altered.
    
    //This request will be the POST body for the authentication
    const request = {
        code,
        client_id,
        client_secret,
        redirect_uri, //no need to 'encodeURIComponent' here
        grant_type: 'authorization_code'
    };

    //the response variable will contain an access token and a refresh token in JSON form. The refresh token will expire one hour after accessing.
    const response = await axios.post('https://ed.link/api/authentication/token', request); 

    /* If successful the response will look like this ->
    {
        '$data': {      
            access_token: '...',
            refresh_token: '......',
            token_type: 'Bearer',
            expires_in: 3600
        },
        '$request': '...'
    }
    */

    //You can then use the access token or bearer token to reach protected endpoints such as the user profile, listed below
    const access_token = response.data.$data.access_token;
    const profile = await axios.get('https://ed.link/api/v2/my/profile', {
        headers: {
            'Authorization': `Bearer ${access_token}`
        }
    });
})

//the following lines are express related to run the router
app.use(router);
 
app.listen(PORT, function(err: any){
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});