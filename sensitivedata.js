const fs = require('fs');
const path = require('path');

// File paths
const inputFile = path.join(__dirname, 'Allvariables.txt');
const sysFile = path.join(__dirname, 'system_variables.txt');
const globalFile = path.join(__dirname, 'global_variables.txt');
const otherFile = path.join(__dirname, 'other_variables.txt');
const sensitiveFile = path.join(__dirname, 'sensitive_data.txt');

// Keywords to flag sensitive data (case-insensitive)
const sensitiveKeywords = [
    'clientid', 'client_id', 
    'cardnumber', 'card_number', 'creditcard', 'cvv',
    'accountnumber', 'account_number', 'acct_num',
    'ssn', 'password', 'pin', 'dob', 'token',
    'email', 'emailid', 'email_id', 'e-mail'
];

function processVariables() {
    try {
        // Read the file synchronously
        const data = fs.readFileSync(inputFile, 'utf8');
        
        // Split by new line, handling both Windows (\r\n) and Linux (\n) line endings
        const lines = data.split(/\r?\n/);
        
        // Extract the header row
        const header = lines[0];

        // Initialize arrays with the header row
        const systemVars = [header];
        const globalVars = [header];
        const otherVars = [header];
        const sensitiveVars = [header]; 

        // Loop through the remaining rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const parts = line.split(';');
            
            // Ensure the line has the correct number of columns before checking
            if (parts.length < 3) continue;

            const objectName = parts[2]; // 'Object Name' is the 3rd column

            // Categorization Logic
            if (objectName.includes('SystemVariable')) {
                systemVars.push(line);
            } 
            else if (objectName.startsWith('Data.') && !objectName.includes('LocalVariables')) {
                // Variables in Data tree that aren't system or local are typically Global
                globalVars.push(line);
            } 
            else {
                // Check if the line (or objectName) contains sensitive keywords
                const lowerCaseLine = line.toLowerCase();
                const isSensitive = sensitiveKeywords.some(keyword => lowerCaseLine.includes(keyword));

                if (isSensitive) {
                    sensitiveVars.push(line);
                } else {
                    // Everything else (Flows, LocalVariables, Images, etc.)
                    otherVars.push(line);
                }
            }
        }

        // Write the categorized data to their respective files
        fs.writeFileSync(sysFile, systemVars.join('\n'));
        fs.writeFileSync(globalFile, globalVars.join('\n'));
        fs.writeFileSync(otherFile, otherVars.join('\n'));
        fs.writeFileSync(sensitiveFile, sensitiveVars.join('\n'));

        // Calculate counts (subtracting 1 to account for the header row)
        const sensitiveCount = sensitiveVars.length - 1;

        console.log('Successfully separated variables!');
        console.log(`- System Variables:    ${systemVars.length - 1} found`);
        console.log(`- Global Variables:    ${globalVars.length - 1} found`);
        
        // Conditional logging for sensitive data
        if (sensitiveCount === 0) {
            console.log(`- Sensitive Variables: 0 found. No sensitive data detected!`);
        } else {
            console.log(`- Sensitive Variables: ${sensitiveCount} found`);
        }
        
        console.log(`- Other Variables:     ${otherVars.length - 1} found`);

    } catch (err) {
        console.error('Error processing the file:', err.message);
    }
}

processVariables();
