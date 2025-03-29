# Salesforce MCP Sample Integration

This project provides a basic example of integrating with Salesforce using the Model Context Protocol (MCP). It allows interaction with Salesforce features like sending emails and deploying Apex code through MCP tools.

## Prerequisites

*   Node.js and npm (or yarn) installed.
*   A Salesforce org where you can create a Connected App.

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Configure Salesforce Credentials:**
    *   You MUST create a `credentials.js` file inside a `utils` folder (`./utils/credentials.js`).
    *   This file needs to export a function `getSalesforceCredentials()` which returns your Salesforce connection details necessary for JWT Bearer Flow authentication.
    *   **Important:** Ensure you have a [Connected App configured in Salesforce](https://help.salesforce.com/s/articleView?id=sf.connected_app_create_api_integration.htm&type=5) for JWT authentication, allowing the appropriate scopes and pre-authorizing the relevant user profile.

    **`utils/credentials.js` Example:**

    ```javascript
    import fs from 'fs';
    import path from 'path';
    // You might load these from environment variables, a config file, etc.

    export function getSalesforceCredentials() {
        // --- IMPLEMENT YOUR LOGIC HERE to securely load credentials ---
        const loginUrl = "YOUR_SALESFORCE_LOGIN_URL"; // e.g., https://login.salesforce.com or https://yourdomain.my.salesforce.com
        const username = "YOUR_SALESFORCE_USERNAME";
        const clientId = "YOUR_CONNECTED_APP_CONSUMER_KEY";
        // Load your private key used to sign the JWT assertion
        // Ensure the key is formatted correctly, including BEGIN/END lines.
        const privateKey = fs.readFileSync(path.resolve(__dirname, 'path/to/your/server.key'), 'utf8'); 
        // Example: const privateKey = process.env.SF_PRIVATE_KEY;

        if (!loginUrl || !username || !clientId || !privateKey) {
             throw new Error("Missing required Salesforce credentials in utils/credentials.js");
        }

        return {
            loginUrl,
            username,
            clientId,
            privateKey
        };
    }
    ```

3.  **Configuration File:**
    *   The repository includes a sample `claude_desktop_config.json` file that can be used as a template for configuring your MCP server.
    *   Update the paths and credentials in this file according to your environment setup.

## Running the Server

```bash
node server.js
```

## Demo

Check out the video preview of this integration in action:

[![Salesforce MCP Integration Demo](https://img.youtube.com/vi/T883nXqatZ4/0.jpg)](https://www.youtube.com/watch?v=T883nXqatZ4)