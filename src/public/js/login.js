// JavaScript Document

function login() {
	$.ajax({
		url: '/api/my/login',
		dataType: 'json',
		type: 'get',
		contentType: 'application/jsonp',
		data: JSON.stringify({
			"username": `${document.getElementById('username').value}`,
			"password": `${document.getElementById('password').value}`
		}),
		processData: false,
		complete: function (data, textStatus, jQxhr) {
			location.reload();
		}
	});
}

function logout() {
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

function getSoldTickets(event_id, venue_section_name) {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: `/api/getTickets/${event_id}/${venue_section_name}`,
			dataType: 'json',
			type: 'get',
			contentType: 'application/jsonp',
			processData: false,
			complete: function (data, textStatus, jQxhr) {
				console.log(JSON.stringify(data));
				console.log(JSON.stringify(textStatus));
				console.log(JSON.stringify(jQxhr));
				resolve(data);
			}
		});
	});
}