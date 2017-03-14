# AuthUser API API documentation version Beta
https://mocksvc.mulesoft.com/mocks/2b13f76a-4794-4729-bf46-0d52d3400b53/mocks/1cd02915-0218-4cb3-8658-271b8237950e/user/

---

## /user
A user management API - A point of user management for all of T&F. <br /><br />
Please check out our source code here: http://bitbucket.crcpress.local:7990/projects/CP/repos/authuser-api/browse

### /user/auth/signup
Register a user with basic information First and Last name, username (email) and password.

* **post**: Register a user with basic information First and Last name, username (email) and password.

### /user/auth/login
Authenticate a username and password (login attempt)

* **post**: Authenticate a username and password (login attempt)

### /user/auth/logout
Log a user out

* **post**: Log out a user with their auth token

### /user/auth/authtokenverification
Verify a user's auth token

* **put**: Verify a user's auth token

### /user/auth/registrationverification
Validate a user's registration using the registrationVerificationToken obtained from the user profile.

* **put**: Validate a user's registration using the registrationVerificationToken obtained from the user profile.

### /user/auth/orcid?clientId={clientId}
Authenticate with ORCID login

* **get**: Authenticate through ORCID.org (login attempt). Request is redirected to the ORCID login page. End user fills out his ORCID login details and authorizes our request. Lastly the callback response is redirected to ./orcid/callback.

### /user/auth/search
Search for a user by their username

* **get**: Search for user with their username

### /user/auth/forgotpassword
Forgot Password Flow - GET with username to generate a resetPasswordToken. POST to validate the resetPasswordToken. PUT username and newPassword to update the user's password.

* **get**: Step 1. This will generate a resetPasswordToken for user {username}.
* **post**: Step 2. Validate Reset Password Token
* **put**: Step 3. Change the user's password to his choosing. Will only work after validation.

### /user/self

* **get**: Get user orcid profile information with header authtoken

### /user/list
List 1 registered user. Used for testing availability.

* **get**: Get 1 registered user. Used for testing availability.

### /user/{id}
Read, Update and Delete users by their ID.

* **get**: Get user information by their ID
* **put**: Update any and all user information with their ID.
* **delete**: Delete user by their ID

