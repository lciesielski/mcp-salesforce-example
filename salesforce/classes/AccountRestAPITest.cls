@IsTest
private class AccountRestAPITest {
	
	@TestSetup
	static void setupTestData() {
		Account testAccount = new Account(
			Name = 'Test Account',
			Country__c = 'US'
		);
		insert testAccount;
	}
	
	@IsTest
	static void testGetAccounts_Success() {
		RestRequest req = new RestRequest();
		req.requestURI = '/services/apexrest/v1/accounts/';
		req.httpMethod = 'GET';
		RestContext.request = req;
		RestContext.response = new RestResponse();
		
		Test.startTest();
		AccountRestAPI.AccountResponse response = AccountRestAPI.getAccounts();
		Test.stopTest();
		
		System.assertEquals(true, response.success);
		System.assertEquals('Account retrieved successfully', response.message);
		System.assertNotEquals(null, response.data);
	}
	
	@IsTest
	static void testGetAccounts_Error() {
		delete [SELECT Id FROM Account];
		
		RestRequest req = new RestRequest();
		req.requestURI = '/services/apexrest/v1/accounts/';
		req.httpMethod = 'GET';
		RestContext.request = req;
		RestContext.response = new RestResponse();
		
		Test.startTest();
		AccountRestAPI.AccountResponse response = AccountRestAPI.getAccounts();
		Test.stopTest();
		
		System.assertEquals(false, response.success);
		System.assertEquals('Account not found', response.message);
		System.assertEquals(null, response.data);
		System.assertEquals(404, RestContext.response.statusCode);
	}
}