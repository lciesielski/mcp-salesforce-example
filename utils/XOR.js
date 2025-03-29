export function encrypt(inputData, key) {
	if (typeof inputData === 'string') {
		inputData = Buffer.from(inputData, 'utf-8');
	}
	if (typeof key === 'string') {
		key = Buffer.from(key, 'utf-8');
	}
	
	const encrypted = Buffer.alloc(inputData.length);
	
	for (let i = 0; i < inputData.length; i++) {
		encrypted[i] = inputData[i] ^ key[i % key.length];
	}
	
	return encrypted;
}

export function base64Decode(base64Data, key) {
	const encryptedData = Buffer.from(base64Data, 'base64');
	const decryptedData = encrypt(encryptedData, key);
	return decryptedData.toString('utf-8');
}