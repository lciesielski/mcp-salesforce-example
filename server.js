import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { sendEmail } from "./salesforce/mails.js";
import { deployAccountRESTService } from "./salesforce/deploy.js";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";

const server = new McpServer({
	name: "Salesforce",
	version: "1.0.0"
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

fs.readdirSync(path.join(__dirname, "salesforce", "classes")).forEach(file => {
	if (file.endsWith(".cls")) {
		const filePath = path.join(__dirname, "salesforce", "classes", file);
		const fileUri = pathToFileURL(filePath);

		server.resource(
			file,
			fileUri.href,
			async (uri) => ({
				contents: [{
					uri: uri.href,
					text: `${fs.readFileSync(filePath)}`
				}]
			})
		);
	}
});

server.tool(
	"operateResourcesAt",
	{
		folderPath: z.string(),
		validate: z.boolean().optional()
	},
	async (payload) => {
		try {
			const result = await deployAccountRESTService(payload.folderPath, payload.validate);
			
			return {
				content: [
					{ 
						type: "text", 
						text: `Deployment status is ${result.deployResult.status}`
					}
				]
			};
		} catch (error) {
			return {
				content: [
					{ 
						type: "text", 
						text: `Failed to deploy: ${error.message}`
					}
				]
			};
		}
	}
);

server.tool(
	"sendSalesforceEmail",
	{
		toAddresses: z.array(z.string().email()),
		subject: z.string(),
		plainTextBody: z.string().optional(),
		sendRichBody: z.boolean().optional()
	},
	async (emailDetails) => {
		try {
			const result = await sendEmail(emailDetails);
			
			return {
				content: [
					{ 
						type: "text", 
						text: `Email successfully sent to ${emailDetails.toAddresses.join(", ")},.
							Subject: ${emailDetails.subject}
							${result[0].isSuccess ? "Status: Success" : "Status: Fail"}`
					}
				]
			};
		} catch (error) {
			return {
				content: [
					{ 
						type: "text", 
						text: `Failed to send email: ${error.message}`
					}
				]
			};
		}
	}
);

server.prompt(
	"sendSalesforceEmail",
	{ message: z.string() },
	({ message }) => ({
		messages: [{
			role: "user",
			content: {
				type: "text",
				text: `I need to send a test email through Salesforce. Please use the sendSalesforceEmail tool with the following details:

					Send to: l.ciesielski0@gmail.com
					Subject: Test Email from Salesforce MCP Integration
					Add a simple HTML greeting with my name (Luke) in bold to the message.
					Add a simple random trivia about diablo game franchise (from diablo 1 or diablo 2) to the message.
					Message: ${message}

					If you will use HTML in the email bosy you MUST set sendRichBody to true.
					
					Let me know once the email has been sent and what the response from the server was.`
			}
		}]
	})
);

const transport = new StdioServerTransport();
await server.connect(transport);