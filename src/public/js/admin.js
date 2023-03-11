// JavaScript Document

function createUser() {
	var data = {
		'\"username\"': document.getElementById('username').value,
		'\"password\"': document.getElementById('password').value,
		'\"email\"': document.getElementById('email').value,
		'\"first_name\"': document.getElementById('first_name').value,
		'\"last_name\"': document.getElementById('last_name').value
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