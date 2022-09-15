import * as dotenv from 'dotenv';
import axios from 'axios';

// Add environment variables from our local .env file to process.env
dotenv.config({ path: `${__dirname}/../../.env` });

const header_config = {
    headers: {
        authorization: `Bearer ${process.env.sample_integration_access_token}`
    }
};

/**
 * This file demonstrates how to query each of the Edlink Graph API entity endpoints
 * and retrieve a full copy of the source dataset, which can then be written to
 * a database and saved / queried.
 */
(async () => {

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

    const districts_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const district of districts_response.data.$data) {
        source_dataset.districts.push(district);
    }

    const schools_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const school of schools_response.data.$data) {
        source_dataset.schools.push(school);
    }

    const sessions_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const session of sessions_response.data.$data) {
        source_dataset.sessions.push(session);
    }

    const courses_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const course of courses_response.data.$data) {
        source_dataset.courses.push(course);
    }

    const people_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const person of people_response.data.$data) {
        source_dataset.people.push(person);
    }

    const classes_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const _class of classes_response.data.$data) {
        source_dataset.classes.push(_class);
    }

    const sections_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const section of sections_response.data.$data) {
        source_dataset.sections.push(section);
    }

    const enrollments_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const enrollment of enrollments_response.data.$data) {
        source_dataset.enrollments.push(enrollment);
    }

    const agents_response = await axios.get('https://ed.link/api/v2/graph/districts', header_config);
    for(const agent of agents_response.data.$data) {
        source_dataset.agents.push(agent);
    }

    console.log("All entity types loaded!");
})();
