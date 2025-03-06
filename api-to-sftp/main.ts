import { Edlink, IntegrationState, Integration, TokenSetType, Person, Role, IdentifierType, Gender, Agent, Class, Course, SessionType, GradeLevel, Enrollment, ClassState } from '@edlink/typescript';
import SFTPClient from 'ssh2-sftp-client';
import axios from 'axios';
import Queue from 'promise-queue';
import Papa from 'papaparse';

const SYNC_INTERVAL = process.env.SYNC_INTERVAL ? parseInt(process.env.SYNC_INTERVAL) : 1000 * 60 * 60 * 24; // 24 hours
const MAX_PARALLEL_JOBS = process.env.MAX_PARALLEL_JOBS ? parseInt(process.env.MAX_PARALLEL_JOBS) : 1;

const EDLINK_CLIENT_ID = process.env.EDLINK_CLIENT_ID;
const EDLINK_CLIENT_SECRET = process.env.EDLINK_CLIENT_SECRET;

const SFTP_USERNAME = process.env.SFTP_USERNAME;
const SFTP_PASSWORD = process.env.SFTP_PASSWORD;
const SFTP_PORT = process.env.SFTP_PORT;
const SFTP_HOST = process.env.SFTP_HOST;

// SFTP Server Configuration
const SFTP_CONFIG = {
    host: SFTP_HOST,
    port: SFTP_PORT,
    username: SFTP_USERNAME,
    password: SFTP_PASSWORD
};

// Initialize a queue that allows processing of N elements concurrently (at the same time) and with no max length.
const queue = new Queue(MAX_PARALLEL_JOBS, Infinity);

// Initialize our SFTP client.
const sftp = new SFTPClient();

// Initialize the Edlink API client with the client ID and secret.
const edlink = new Edlink({
    version: 2,
    client_id: EDLINK_CLIENT_ID,
    client_secret: EDLINK_CLIENT_SECRET
});

async function sync(){
    // First, list all of our available integrations.
    // There is not currently an @edlink/typescript method for this, so we will use axios to make the API call directly.
    const { data } = await axios.get('https://ed.link/api/v1/integrations', {
        headers: {
            Authorization: `Bearer ${EDLINK_CLIENT_SECRET}`
        }
    });

    // Let's filter to only the active ones.
    const integrations: Integration[] = data.$data.filter((integration: any) => integration.status === IntegrationState.Active);

    console.log(`Found ${data.$data.length} active integrations.`);

    // Now, we will iterate through each integration and fetch the data by pushing a promise to the queue.
    for(const integration of integrations){
        queue.add(() => ingest(integration));
    }
}

async function ingest(integration: Integration){
    console.log('Starting sync for integration:', integration.id);

    // Set the tokens for this integration so we can use the SDK to make requests.
    const context = edlink.use({
        access_token: integration.access_token,
        type: TokenSetType.Integration
    });

    // The resulting map will store the filename as the key and the data as the value.
    const result: Map<string, any[]> = new Map([
        ['districts', []],
        ['schools', []],
        ['sessions', []],
        ['subjects', []],
        ['courses', []],
        ['classes', []],
        ['people', []],
        ['enrollments', []],
        ['agents', []]
    ]);

    // Fetch the data from the API.
    for await (const district of context.districts.list()){
        result.get('districts')!.push(district);
    }

    for await (const school of context.schools.list()){
        result.get('schools')!.push(school);
    }

    for await (const session of context.sessions.list()){
        result.get('sessions')!.push(session);
    }

    for await (const course of context.courses.list({ expand: [ 'subject', 'session' ] })){
        result.get('courses')!.push(course);
    }

    for await (const cls of context.classes.list()){
        result.get('classes')!.push(cls);
    }

    for await (const person of context.people.list()){
        result.get('people')!.push(person);
    }

    for await (const enrollment of context.enrollments.list()){
        result.get('enrollments')!.push(enrollment);
    }

    for await (const agent of context.agents.list()){
        result.get('agents')!.push(agent);
    }

    try {
        console.log('Opening SFTP connection.');

        // Connect to the SFTP server.
        await sftp.connect(SFTP_CONFIG);

        console.log('Connected to SFTP.');

        // Apply any necessary formatting to the data and return a new map of files.
        const formatted = format(result);
        
        // Write the data to the SFTP server.
        for (const [ filename, data ] of formatted.entries()) {
            if (data.length === 0) {
                continue;
            }
            
            await sftp.put(Buffer.from(Papa.unparse(data)), `/remote/path/${integration.id}/${filename}.csv`);
        }
    } catch (err) {
        console.error('SFTP Upload Error:', err);
    } finally {
        await sftp.end();
    }

    console.log('Sync complete for integration:', integration.id);
}

function format(data: Map<string, any[]>): Map<string, any[]>{
    const formatted: Map<string, any[]> = new Map([
        ['student', []],
        ['staff', []],
        ['parents', []],
        ['course_grades', []],
        ['course_catalog', []],
        ['case_load', []],
        ['case_load_members', []],
        ['case_load_import', []],
        ['gpa_import', []]
    ]);

    // We're going to need to keep an index of students and parents for later use.
    const people: Map<string, Person> = new Map();
    const classes: Map<string, Class> = new Map();
    const courses: Map<string, Course> = new Map();
    
    // Build the various people files.
    for(const person of data.get('people')! as Iterable<Person>){
        // Save the person into the index.
        people.set(person.id, person);

        if(person.roles.includes(Role.Student)){
            const iso = person.demographics.birthday?.toString();
            const school = person.school_ids.sort().pop();

            formatted.get('student')!.push({
                SchoolID: school, // How do we want to handle multiple schools?
                StudentID: person.id,
                Email: person.email,
                FirstName: person.first_name,
                MiddleName: person.middle_name,
                LastName: person.last_name,
                NickName: person.display_name,
                DateOfBirth: iso ? (iso.slice(5, 7) + '/' + iso.slice(8, 10) + '/' + iso.slice(0, 4)) : null,
                Gender: person.demographics.gender === Gender.Other ? 'X' : person.demographics.gender,
                Grade: person.grade_levels.sort().pop(),
                Classof: person.graduation_year,
                Address1: person.address.street,
                Address2: person.address.unit,
                City: person.address.city,
                State: person.address.state,
                Zipcode: person.address.postal_code,
                Country: person.address.country,
                Citizenship: null,
                EnrollmentEndDate: null,
                Telephone: person.phone,
                FAFSA: null,
                Race: null, // How do we want to map this?
                Ethnicity: null // How do we want to map this?
            });

            formatted.get('gpa_import')!.push({
                SchoolID: school,
                StudentID: person.id,
                CGPA: person.gpa
            });
        }

        // Do these two types have to be mutually exclusive?
        // What if one user has two roles in their SIS?

        if(person.roles.includes(Role.Teacher)){
            formatted.get('staff')!.push({
                SchoolID: person.school_ids.sort().pop(), // How do we want to handle multiple schools?
                StaffID: person.id,
                FirstName: person.first_name,
                LastName: person.last_name,
                Email: person.email,
                Role: 'Teacher'
            });
        }

        if(person.roles.includes(Role.Administrator)){
            formatted.get('staff')!.push({
                SchoolID: person.school_ids.sort().pop(), // How do we want to handle multiple schools?
                StaffID: person.id,
                FirstName: person.first_name,
                LastName: person.last_name,
                Email: person.email,
                Role: 'Schooladmin'
            });
        }
    }

    for(const agent of data.get('agents')! as Iterable<Agent>){
        const target = people.get(agent.target_id);
        const observer = people.get(agent.observer_id);

        if(!target){
            continue;
        }

        if(!observer){
            continue;
        }

        formatted.get('parents')!.push({
            SchoolID: target.school_ids.sort().pop(),
            StudentID: target.id,
            FirstName: observer.first_name,
            LastName: observer.last_name,
            Email: observer.email,
            Phone: observer.phone
        });
    }

    // We need to build the class and course indices for the next step.
    for(const course of data.get('courses')! as Iterable<Course>){
        courses.set(course.id, course);

        formatted.get('course_catalog')!.push({
            SubjectName: course.subject?.name,
            CourseTitle: course.name,
            Description: null,
            CourseNumber: course.code,
            TermType: (() => {
                switch(course.session?.type){
                    case SessionType.SchoolYear:
                        return 'Year';
                    case SessionType.Semester:
                        return 'Semester';
                    default:
                        return 'Quarter';
                }
            })(),
            AcademicIndicator: null,
            Credits: null,
            AcademicType: null,
            CourseOffered: null, // TODO Can this be calculated?
            SchoolType: null, // We don't necessarily know this.
            AcademicYear: course.session?.end_date?.slice(0, 4),
            GradeAvailability: course.grade_levels.filter(g => [GradeLevel.NinthGrade, GradeLevel.TenthGrade].includes(g)).pop(),
            Term: null,
            NCAA: null,
            DualCredit: null,
            StateCourseCode: course.identifiers.find(i => i.type === IdentifierType.State)?.value,
            MSCourseHSCredit: null,
            CollegeArticulated: null,
            CTEPathway: null
        });
    }

    // We need to build the class and course indices for the next step.
    for(const cls of data.get('classes')! as Iterable<Class>){
        if(!cls.course_id){
            continue;
        }

        classes.set(cls.id, cls);
    }

    for(const enrollment of data.get('enrollments')! as Iterable<Enrollment>){
        if(enrollment.role !== Role.Student){
            continue;
        }

        const student = people.get(enrollment.person_id);

        if(!student){
            continue;
        }

        const cls = classes.get(enrollment.class_id);

        if(!cls?.course_id){
            continue;
        }

        const course = courses.get(cls.course_id);

        if(!course){
            continue;
        }

        formatted.get('course_grades')!.push({
            SchoolID: cls.school_id,
            StudentID: student.id,
            SchoolYear: course.session?.end_date?.slice(0, 4),
            Grade: course.grade_levels.filter(g => [GradeLevel.NinthGrade, GradeLevel.TenthGrade].includes(g)).pop(),
            SubjectArea: null,
            LocalCourseID: null,
            LocalCourseName: null,
            Term: null,
            WorkInProgress: [ ClassState.Active, ClassState.Upcoming ].includes(cls.state) ? 'Y' : 'N',
            AcademicIndicator: null,
            COPrepIndicator: null,
            NCAA: null,
            CreditsAttempted: null,
            CreditsEarned: null,
            CourseGrade: enrollment.final_numeric_grade
        });
    }

    return formatted;
}

setInterval(sync, SYNC_INTERVAL);

sync();