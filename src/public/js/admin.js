// JavaScript Document

function createUser() {
	// headers = {
	// 	'Content-Type': 'application/json',
	// }

	// json_data = {
	// 	'username': document.getElementById('username').value,
	// 	'password': document.getElementById('password').value,
	// 	'email': document.getElementById('email').value,
	// 	'first_name': document.getElementById('first_name').value,
	// 	'last_name': document.getElementById('last_name').value,
	// }

	const settings = {
		"async": true,
		"crossDomain": true,
		"url": "http://18.219.2.17:3000/api/my/create",
		"method": "POST",
		"headers": {
			"Content-Type": "application/json"
		},
		"processData": false,
		"data": `{\n    \"username\" : \"${document.getElementById('username').value}\",\n    \"password\" : \"${document.getElementById('password').value}\",\n    \"email\" : \"${document.getElementById('email').value}\",\n    \"first_name\" : \"${document.getElementById('first_name').value}\",\n    \"last_name\" : \"${document.getElementById('last_name').value}\"\n}\n`
	};

	$.ajax(settings).done(function (response) {
		console.log(response);
	});
}