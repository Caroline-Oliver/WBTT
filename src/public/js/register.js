window.addEventListener('load', () => {
    document.getElementById('register-button').addEventListener('submit', (event) => {
        event.preventDefault();
        register();
    })

	var login = document.getElementById("login");
	login.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("register-button").click();
	});

    var password = document.getElementById("password");
	password.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("register-button").click();
	});

    var email = document.getElementById("email");
	email.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("register-button").click();
	});

    var first_name = document.getElementById("first_name");
	first_name.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("register-button").click();
	});

    var last_name = document.getElementById("last_name");
	last_name.addEventListener("keypress", (event) => {
		if (event.key === "Enter") document.getElementById("register-button").click();
	});
});

function register() {
    console.log('attempting to register');
	var sentinel = -1
	window.localStorage.setItem('minutes', sentinel);
	window.localStorage.setItem('seconds', sentinel);

	callRegister()
        .catch( (err) => {
            console.log('errored');
            console.log(err);
            console.log(err.message);
            document.getElementById('error_box').innerHTML = 'Failed to create account';
        })
        .then( (result) => {
            console.log(result);
            if (result != "Account successfully created!"){
                document.getElementById('error-box').innerHTML = result;
                document.getElementById('success-box').innerHTML = '';
            }
            else{
                document.getElementById('error-box').innerHTML = '';
                document.getElementById('success-box').innerHTML = result;
            }
        })
}

function callRegister() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/my/create',
            dataType: 'text',
            type: 'get',
            contentType: 'application/jsonp',
            data: JSON.stringify({
                "username": `${document.getElementById('username').value}`,
                "password": `${document.getElementById('password').value}`,
                "email": `${document.getElementById('email').value}`,
                "first_name": `${document.getElementById('first_name').value}`,
                "last_name": `${document.getElementById('last_name').value}`
            }),
            success: function (data) {
                resolve(data);
            },
            error: function(data) {
                // consider doing more sophisticated error messages
                reject(data);
            }
        });
    })
}