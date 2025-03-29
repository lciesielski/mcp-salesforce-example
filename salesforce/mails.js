import axios from 'axios';
import { sessionId, instanceUrl, loginToSalesforce } from './login.js';

export async function sendEmail(emailDetails) {
	try {
		if (!sessionId || !instanceUrl) {
			const session = await loginToSalesforce();
		}
		const emailPayload = {
			inputs: [
				{
					emailAddresses: emailDetails.toAddresses.join(','),
					emailSubject: emailDetails.subject,
					emailBody: emailDetails.plainTextBody
				}
			]
		};
		const headers = {
			'Authorization': `Bearer ${sessionId}`,
			'Content-Type': 'application/json'
		};
		const response = await axios.post(
			`${instanceUrl}/services/data/v61.0/actions/standard/emailSimple`,
			emailPayload,
			{ headers }
		);
		return response.data;
	} catch (error) {
		console.error('Error sending email via Salesforce:', error.message);
		if (error.response) {
			console.error('Response data:', error.response.data);
		}
		throw error;
	}
}