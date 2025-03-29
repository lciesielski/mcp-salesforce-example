import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import AdmZip from "adm-zip";
import { loginToSalesforce, validateSession, sessionId, instanceUrl } from "./login.js";

export async function deployApexToSalesforce(files, options = {}) {
	try {
		let isValidSession = await validateSession();
		if (!isValidSession) {
			await loginToSalesforce();
		}

		if (!sessionId || !instanceUrl) {
			throw new Error("Failed to obtain valid Salesforce session");
		}

		const zip = new AdmZip();
		
		const packageXml = createPackageXml(files);
		zip.addFile("package.xml", Buffer.from(packageXml, "utf8"));
		
		for (const file of files) {
			const fileName = path.basename(file.path);
			const fileContent = fs.readFileSync(file.path, "utf8");
			const zipPath = `classes/${fileName}`;
			zip.addFile(zipPath, Buffer.from(fileContent, "utf8"));
			
			// Add the required metadata file for each Apex class
			const metadataFileName = `${fileName}-meta.xml`;
			const metadataContent = createApexClassMetadata();
			const metadataZipPath = `classes/${metadataFileName}`;
			zip.addFile(metadataZipPath, Buffer.from(metadataContent, "utf8"));
		}
		
		const zipBuffer = zip.toBuffer();
		const tempZipPath = path.join(process.cwd(), "deploy.zip");
		fs.writeFileSync(tempZipPath, zipBuffer);
		
		const defaultOptions = {
			allowMissingFiles: false,
			autoUpdatePackage: false,
			checkOnly: false,
			ignoreWarnings: false,
			performRetrieve: false,
			purgeOnDelete: false,
			rollbackOnError: true,
			runTests: null,
			singlePackage: true,
			testLevel: "RunLocalTests"
		};
		
		const deployOptions = { ...defaultOptions, ...options };
		const formData = new FormData();
		const jsonPart = {
			deployOptions: deployOptions
		};
		formData.append("json", JSON.stringify(jsonPart), {
			contentType: "application/json"
		});
		
		formData.append("file", fs.createReadStream(tempZipPath), {
			filename: "deploy.zip",
			contentType: "application/zip"
		});
		
		const deployResponse = await axios.post(
			`${instanceUrl}/services/data/v61.0/metadata/deployRequest`,
			formData,
			{
				headers: {
					...formData.getHeaders(),
					"Authorization": `Bearer ${sessionId}`
				}
			}
		);
		
		fs.unlinkSync(tempZipPath);
		
		const deploymentId = deployResponse.data.id;
		
		const deployResult = await pollDeploymentStatus(deploymentId);
		return deployResult;
		
	} catch (error) {
		console.error("Error in deployment:", error.message);
		if (error.response) {
			console.error("Response status:", error.response.status);
			console.error("Response data:", error.response.data);
		}
		throw error;
	}
}

function createApexClassMetadata(apiVersion = "62.0") {
	return `<?xml version="1.0" encoding="UTF-8"?>
<ApexClass xmlns="http://soap.sforce.com/2006/04/metadata">
	<apiVersion>${apiVersion}</apiVersion>
</ApexClass>`;
}

async function pollDeploymentStatus(deploymentId, maxAttempts = 30, interval = 5000) {
	let attempts = 0;
	
	while (attempts < maxAttempts) {
		attempts++;
		
		try {
			const response = await axios.get(
				`${instanceUrl}/services/data/v62.0/metadata/deployRequest/${deploymentId}?includeDetails=true`,
				{
					headers: {
						"Authorization": `Bearer ${sessionId}`
					}
				}
			);
			
			const deployResult = response.data;
			
			if (deployResult.deployResult && deployResult.deployResult.done === true) {
				if (deployResult.deployResult.details && 
					deployResult.deployResult.details.componentFailures &&
					deployResult.deployResult.details.componentFailures.length > 0) {
					
					console.error("Component failures:");
					deployResult.deployResult.details.componentFailures.forEach(failure => {
						console.error(`- ${failure.fileName}: ${failure.problem}`);
					});
				}
				
				return deployResult;
			}
			
			await new Promise(resolve => setTimeout(resolve, interval));
		} catch (error) {
			console.error("Error checking deployment status:", error.message);
			if (error.response) {
				console.error("Response data:", error.response.data);
			}
			
			await new Promise(resolve => setTimeout(resolve, interval));
		}
	}
	
	throw new Error(`Deployment polling timed out after ${maxAttempts} attempts`);
}

function createPackageXml(files) {
	const classNames = files.map(file => {
		const fileName = path.basename(file.path);
		return fileName.replace(".cls", "");
	});
	
	const packageXml = `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
	<types>
		<members>${classNames.join("</members>\n		<members>")}</members>
		<name>ApexClass</name>
	</types>
	<version>63.0</version>
</Package>`;
	
	return packageXml;
}

export async function deployAccountRESTService(folderPath, validate) {
	const files = [];

	fs.readdirSync(folderPath).forEach(file => {
		if (file.endsWith(".cls")) {
			files.push({
				path: path.join(folderPath, file),
				type: "ApexClass"
			});
		}
	});
	
	const deployOptions = {
		checkOnly: validate,
		testLevel: "RunSpecifiedTests",
		runTests: ["AccountRestAPITest"]
	};
	
	return deployApexToSalesforce(files, deployOptions);
}