// JavaScript Document

function createUser() {
	headers = {
		'Content-Type': 'application/json',
	}

	json_data = {
		'username': document.getElementById('username').value,
		'password': document.getElementById('password').value,
		'email': document.getElementById('email').value,
		'first_name': document.getElementById('first_name').value,
		'last_name': document.getElementById('last_name').value,
	}

	response = requests.post('http://18.219.2.17:3000/api/my/create', headers = headers, json = json_data)
	console.log(response)
}