function applyDiscount() {
    let promocode = document.getElementById('promocode').value;
    if (promocode != null && promocode != '') {
        sendServerApplyDiscount(promocode)
            .catch((err) => {
                document.getElementById('error-box').innerHTML = 'Some error occured. Please try again.';
                document.getElementById('success-box').innerHTML = '';
            })
            .then((result) => {
                if (result == 'Code successfully set.') {
                    location.reload();
                }
                else {
                    document.getElementById('error-box').innerHTML = result;
                    document.getElementById('success-box').innerHTML = '';
                }
            })
    }
    else {
        document.getElementById('error-box').innerHTML = 'Please enter a code';
        document.getElementById('success-box').innerHTML = '';
    }
}

function sendServerApplyDiscount(promocode) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/my/setDiscountCode',
            dataType: 'text',
            type: 'post',
            contentType: 'application/jsonp',
            data: JSON.stringify({
                "promocode": `${promocode}`
            }),
            success: function (data) {
                resolve(data);
            },
            error: function (data) {
                reject(data);
            }
        });
    })
}

function removeTicketFromCart(ticket_id) {
    sendServerRemoveTicket(ticket_id)
        .catch( (err) => {
            console.log(err.message);
            console.log('errored in remove ticket from cart');
        })
        .then( (result) => {
            if (result == 'Successfully removed from cart.')
                location.reload();
        })
}

function sendServerRemoveTicket(ticket_id) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '/api/my/removeFromCart',
            dataType: 'text',
            type: 'get',
            contentType: 'application/jsonp',
            data: JSON.stringify({
                "ticket_id": `${ticket_id}`
            }),
            success: function (data) {
                resolve(data);
            },
            error: function (data) {
                reject(data);
            }
        });
    })
}