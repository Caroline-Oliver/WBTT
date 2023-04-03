function largest_ticket_id() {
    var sql = "SELECT MAX(ticket_id) FROM ticket";
}

function generate(event_id) {
    var sql = '';
    var ticket_template = "INSERT INTO ticket (`ticket_id`, `event_id`, `section_name`, `seat`, `hold`, `sold`, `price`) VALUES ('6', '1', 'top', '1a', '0', '0', '5');";
}