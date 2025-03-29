@RestResource(urlMapping='/v1/accounts/*')
global with sharing class AccountRestAPI {
	
	@HttpGet
	global static AccountResponse getAccounts() {
		RestResponse res = RestContext.response;
		
		try {
			Account acc = [
				SELECT Name, Owner.Name
				FROM Account
				WITH SECURITY_ENFORCED
			];
			
			return new AccountResponse(true, 'Account retrieved successfully', acc);
		} catch (QueryException e) {
			res.statusCode = 404;
			return new AccountResponse(false, 'Account not found', null);
		} catch (Exception e) {
			res.statusCode = 500;
			return new AccountResponse(false, 'Error: ' + e.getMessage(), null);
		}
	}

	global class AccountResponse {
		global Boolean success;
		global String message;
		global Account data;
		
		global AccountResponse(Boolean success, String message, Account data) {
			this.success = success;
			this.message = message;
			this.data = data;
		}
	}
}