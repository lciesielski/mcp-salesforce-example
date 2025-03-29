import dotenv from 'dotenv';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import path from 'path';
import { getSalesforceCredentials } from '../utils/credentials.js';

dotenv.config();

export let sessionId = null;
export let instanceUrl = null;

export async function loginToSalesforce() {
	try {
		const { loginUrl, username, clientId, privateKey } = getSalesforceCredentials();

		if (!loginUrl || !username || !clientId || !privateKey) {
			throw new Error('Missing required environment variables for Salesforce login');
		}

		const jwtPayload = {
			iss: clientId,
			sub: username,
			aud: loginUrl,
			exp: Math.floor(Date.now() / 1000) + 300
		};

		const assertion = jwt.sign(jwtPayload, privateKey, {
			algorithm: 'RS256'
		});

		const params = new URLSearchParams();
		params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
		params.append('assertion', assertion);

		const response = await axios.post(`${loginUrl}/services/oauth2/token`, params, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		sessionId = response.data.access_token;
		instanceUrl = response.data.instance_url;
		
		return {
			sessionId,
			instanceUrl
		};
	} catch (error) {
		console.error('Error logging into Salesforce:', error.message);
		if (error.response) {
			console.error('Response data:', error.response.data);
		}
		throw error;
	}
}

export async function validateSession() {
	if (!sessionId || !instanceUrl) {
		return false;
	}

	try {
		await axios.get(`${instanceUrl}/services/data/v61.0/sobjects/`, {
			headers: {
				Authorization: `Bearer ${sessionId}`
			}
		});
		return true;
	} catch (error) {
		console.log('Session is invalid or expired');
		return false;
	}
}