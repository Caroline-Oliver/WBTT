// JavaScript Document
window.addEventListener('load', () => {

	if (document.getElementById('logout') == null) {
		document.getElementById('login-form').addEventListener('submit', (event) => {
			event.preventDefault();
			login();
		})
	}

	var login_username = document.getElementById("login_username");
	login_username.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("login-button").click();
	});
	
	var login_password = document.getElementById("login_password");
	login_password.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("login-button").click();
	});
	
	var event_search = document.getElementById("eventSearch");
	event_search.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("search-button").click();
	});
});

function login() {
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);
	
	callLogin()
		.catch( (err) => {
			console.log('error');
		})
		.then( (result) => {
			console.log('reloading...');
			console.log(result);
			console.log(document.cookie);
			location.reload();
		})
}
function callLogin() {
	return new Promise( (resolve, reject) => {
		$.ajax({
			url: '/api/my/login',
			dataType: 'text',
			type: 'get',
			contentType: 'text',
			data: JSON.stringify({
				"username": `${document.getElementById('login_username').value}`,
				"password": `${document.getElementById('login_password').value}`
			}),
			processData: false,
			success: function (response) {
				if (response == 'Successfully logged in')
					resolve(response);
				else
					reject();
			},
			error: function() {
				reject();
			}
		});
	});
}

function logout() {
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);
	location.replace('/');
	document.cookie = "token=1; expires = Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

function eventSearch() {
	//alert(`/search?s=${document.getElementById('search').value}`);
	location.replace(`/search?s=${document.getElementById('eventSearch').value}`);
}

function setMessage(message) {
	var printThing = document.getElementById('results');
	printThing.innerHTML = '<P>' + message + '</P>'//response;
}
