// JavaScript Document

	function createUser(userName,password,email,first,last) {
		var data = {
			username: userName,
			password: password,
			email: email,
			first_name: first,
			last_name: last
		}	
	}
	/////////////////////
	var data = {
		user: userJS,
		game: "sudoku",
		score: null,
		time_score: document.getElementById('time').innerHTML
	}
	fetch("https://ec2-18-117-249-143.us-east-2.compute.amazonaws.com/api/?save_score", {
		method: "POST",
		header: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
		body: JSON.stringify(data)
	})
	.then(resp=>resp.text())
	.then(data=> console.log("Response: "+data))
	console.log(data);
	/////////////////////