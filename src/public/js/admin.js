// JavaScript Document

function createUser() {
	var data = {
		username: document.getElementById('username'),
		password: document.getElementById('password'),
		email: document.getElementById('email'),
		first_name: document.getElementById('first_name'),
		last_name: document.getElementById('last_name')
	}
	fetch("/api/my/create", {
		method: "POST",
		header: { "Content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
		body: JSON.stringify(data)
	})
		.then(resp => resp.text())
		.then(data => console.log("Response: " + data))
	console.log(data);
}