var socket = io();
var userId;
var colorCode;

window.onload = function() {
	$("#message").keypress(function (e) {
		// Hit enter to send
		if (e.which == 13) {
			sendMessage();
		}
	});

	var timer;

	// User is typing
	$("#message").keydown(function (e) {
		socket.emit('user is typing', {userId, userId});
		window.clearTimeout(timer);
	});

	// User is not typing
	$("#message").keyup(function (e) {

		timer = window.setTimeout(function() {
			socket.emit('user is not typing', {userId, userId});
		}, 2500);
		
	});

	// Takes new username after user hits enter
	$("#change-username").keypress(function (e) {
		if (e.which == 13) {
			var newUsername = $("#change-username").val();
			if (newUsername != '') {
				socket.emit('username change', {socketId: socket.id, oldUsername: userId, newUsername: newUsername});
				userId = newUsername;
				console.log(userId);
			}
		}
	});

	// trigger file uploads if browser button is clicked
	$("#browse").click(function() {
		$("#upload").trigger("click");
	});

}

function sendImage() {
	var file = $("#upload")[0].files[0];
	var reader = new FileReader();

	if (file){
		reader.readAsDataURL(file);
	}

	reader.onload = function(event) {

		$("#messages").append("<div style='text-align: right'><p class='my-message' style='color: " + colorCode + "'><strong>Me:</strong> <img class='img-thumbnail' src='" + reader.result + "'></p></div>");
    	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;

		socket.emit("outgoing image", {colorCode: colorCode, socketId: socket.id, userId: userId, imageData: reader.result});
	}
}

function updateOnlineUsers(msg) {
	// constructs html for list of online users
	var usersHTML = "";

	Object.keys(msg.usersOnline).forEach(function (key) {
		//console.log(msg.usersOnline);
		usersHTML += "<p><svg height='15' width='30'><circle cx='10' cy='10' r='4' stroke='" + msg.usersOnline[key].colorCode + "' stroke-width='1' fill='" + msg.usersOnline[key].colorCode + "'/></svg>";
		if (msg.usersOnline[key].username == '') {
			usersHTML += key;
		}
		else {
			usersHTML += msg.usersOnline[key].username;
		}
		usersHTML += "</p>"
	});

	$("#usersOnline ul").html(usersHTML);
}

function sendMessage() {
	console.log(colorCode);
	var message = $("#message").val();
	if (message != '') {
		$("#message").val('');
		$("#messages").append("<div style='text-align: right'><p class='my-message' style='color: " + colorCode + "'><strong>Me:</strong> " + message + "</p></div>");
    	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
   		socket.emit('outgoing message', {message: message, userid: userId, colorCode: colorCode, socketid: socket.id});
	}
	else {
		var button = $("#sendMessage");

		button.removeClass('animated shake');
		setInterval(function() {
			button.addClass('animated shake');
		}, 1000);
	}
}

function changeTitle(text) {
	var title = document.title;
	if (title == 'Chatterbox') {
		document.title = text;
	}
	else {
		document.title = 'Chatterbox';
	}
}

function changeColor(colorHex) {
	colorCode = "#" + String(colorHex);
	$(".my-message").css("color", colorCode);
	socket.emit('change color', {socketid: socket.id, colorHex: String(colorHex)});
}

socket.on('connected', function(msg) {
	$("#messages").append("<div><p class='animated flash'><font color='black'><strong>" + msg.userid + "</strong> has connected.</font></p></div>");
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	updateOnlineUsers(msg);
});

socket.on('myUserId', function(msg) {
	$("#change-username").val(msg.userId);

	var tempColorCode = msg.colorCode;
	tempColorCode = tempColorCode.substring(1);

	// converting color code to rgb
	var r = parseInt(tempColorCode.substring(0,2), 16);
	var g = parseInt(tempColorCode.substring(2,4), 16);
	var b = parseInt(tempColorCode.substring(4,6), 16);

	//change background color of input button
	$("#color-picker").css("background-color", "rgb(" + r + "," + g + "," + b + ")");
	$("#color-picker").val(tempColorCode);

	userId = msg.userId;
	colorCode = msg.colorCode;
});

socket.on('disconnected', function(msg) {
	$("#messages").append("<div><p class='animated flash'><font color='black'><strong>" + msg.userid + "</strong> has disconnected.</font></p></div>");
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	updateOnlineUsers(msg);
});

socket.on('incoming message', function(msg){
	console.log(msg.message);
    $("#messages").append("<div><p class='messageOf-" + msg.socketid + "' style='color:" + msg.colorCode + "'><strong>" + msg.userid + "</strong>: " + msg.message + "</p></div><br>");
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;

    //TODO: does not work 100%
    //sets tab notification if user is not on chat tab
    /*
    window.onblur = function() {
	    var title = document.title;
	    var notifInterval = setInterval(function() {
	    	changeTitle(msg.userid + " sent you a message!");
	    },2000);
	};

	window.onfocus = function() {
		console.log('clearing');
		clearInterval(notifInterval);
		document.title = "Chatterbox";
	};

	document.onblur = window.onblur;
	document.onfocus = window.onfocus;*/
});

socket.on('user is typing', function(msg) {
	$("#user-typing").html(msg.userId + " is typing...")
});

socket.on('user is not typing', function(msg) {
	$("#user-typing").html("&nbsp");
});

socket.on('username change', function(msg) {
	$('#messages').append("<div><p class='animated flash'><font color='black'><strong>" + msg.oldUsername + "</strong> changed his/her username to <strong>" + msg.newUsername + '</strong></font></p></div>');
	$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	updateOnlineUsers(msg);
});

socket.on('change color', function(msg) {
	updateOnlineUsers(msg);

	//Change existing chat messages of user to new color
	$(".messageOf-" + msg.socketid).css("color", "#" + msg.colorHex);
});

socket.on('incoming image', function(msg) {
	$("#messages").append("<div><p class='messageOf-" + msg.socketId + "' style='color:" + msg.colorCode + "'><strong>" + msg.userId + "</strong>: <img class='img-thumbnail' src='" + msg.imageData + "'></p></div>");
    $("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
});


