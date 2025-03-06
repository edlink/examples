# API to SFTP Integration

This application fetches data from the Edlink API and uploads it to an SFTP server in CSV format.

## Setting Environment Variables

The following environment variables are used to configure the application:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `EDLINK_CLIENT_ID` | Edlink API client ID | Yes | - |
| `EDLINK_CLIENT_SECRET` | Edlink API client secret | Yes | - |
| `SFTP_HOST` | SFTP server hostname | Yes | - |
| `SFTP_PORT` | SFTP server port | Yes | - |
| `SFTP_USERNAME` | SFTP server username | Yes | - |
| `SFTP_PASSWORD` | SFTP server password | Yes | - |
| `SYNC_INTERVAL` | Time interval between syncs in milliseconds | No | 86400000 (24 hours) |
| `MAX_PARALLEL_JOBS` | Maximum number of integrations to process in parallel | No | 1 |

## Docker Setup

This application can be run as a Docker container. Follow these steps to build and run the Docker image:

### Building the Docker Image

1. Clone this repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd api-to-sftp
   ```

2. Build the Docker image:
   ```bash
   docker build -t api-to-sftp .
   ```

### Running the Docker Container

Run the container with the required environment variables:

```bash
docker run -d \
  --name api-to-sftp \
  -e EDLINK_CLIENT_ID=your_client_id \
  -e EDLINK_CLIENT_SECRET=your_client_secret \
  -e SFTP_HOST=your_sftp_host \
  -e SFTP_PORT=your_sftp_port \
  -e SFTP_USERNAME=your_sftp_username \
  -e SFTP_PASSWORD=your_sftp_password \
  -e SYNC_INTERVAL=86400000 \
  -e MAX_PARALLEL_JOBS=1 \
  api-to-sftp
```

### Viewing Logs

To view the logs from the running container:

```bash
docker logs -f api-to-sftp
```

## Customizing CSV Output

The application transforms Edlink API data into specific CSV formats for export to the SFTP server. You can customize these CSV outputs by modifying the `format` function in `main.ts`.

### Understanding the Format Function

The format function takes a map of raw data from Edlink and transforms it into formatted CSV data:

```typescript
function format(data: Map<string, any[]>): Map<string, any[]> {
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
    
    // Processing logic...
    
    return formatted;
}
```

### Customization Options

Here are ways you can customize the CSV output:

1. **Modify Output Files**: Change the initial map to add, remove, or rename output files:
   ```typescript
   const formatted: Map<string, any[]> = new Map([
       ['student', []],
       ['staff', []],
       // Add new files or remove existing ones
       ['new_custom_file', []]
   ]);
   ```

2. **Change Column Structure**: Modify the object structure that's pushed to each file array to change columns:
   ```typescript
   formatted.get('student')!.push({
       SchoolID: school,
       StudentID: person.id,
       // Modify existing fields
       Email: person.email,
       // Add new fields
       CustomField: person.some_property,
       // Remove fields by excluding them
   });
   ```

3. **Add Data Transformations**: Implement custom transformations for specific fields:
   ```typescript
   // Example: Custom date format transformation
   const customDateFormat = person.demographics.birthday ? 
       new Date(person.demographics.birthday).toLocaleDateString('en-US') : 
       null;
       
   formatted.get('student')!.push({
       // Other fields...
       FormattedDate: customDateFormat
   });
   ```

4. **Filter Records**: Add conditions to filter which records are included in the output:
   ```typescript
   // Only include active students
   if (person.roles.includes(Role.Student) && person.status === 'active') {
       formatted.get('student')!.push({
           // Fields...
       });
   }
   ```

### Example: Adding a Custom CSV File

To add a new CSV file with custom student information:

```typescript
// In the format function initialization
const formatted: Map<string, any[]> = new Map([
    // Existing files...
    ['student_custom', []]
]);

// Later in the processing logic
for(const person of data.get('people')! as Iterable<Person>) {
    if(person.roles.includes(Role.Student)) {
        // Existing student processing...
        
        // Add to custom file
        formatted.get('student_custom')!.push({
            ID: person.id,
            FullName: `${person.first_name} ${person.last_name}`,
            GradeLevel: person.grade_levels.join(', '),
            SchoolCount: person.school_ids.length
        });
    }
}
```

By modifying the format function, you can fully customize the structure, content, and format of the CSV files that are sent to the SFTP server.

