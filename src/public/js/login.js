// JavaScript Document

function login() {
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);
	
	$.ajax({
		url: '/api/my/login',
		dataType: 'json',
		type: 'get',
		contentType: 'application/jsonp',
		data: JSON.stringify({
			"username": `${document.getElementById('login_username').value}`,
			"password": `${document.getElementById('login_password').value}`
		}),
		processData: false,
		complete: function (data, textStatus, jQxhr) {
			location.reload();
		}
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
