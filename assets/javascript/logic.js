$(document).ready(function(){
	var isPlayer1 = false;
	var isPlayer2 = false;
	var player1name = "";
	var player2name = "";
	var player1choice = "";
	var player2choice = "";
	var gameStarted = false;
	var player2wins = 0;
	var player2losses = 0;
	var config = {
		apiKey: "AIzaSyCz6aX9O3yrKDOXqAPw5-iNkP6CCAMo88Y",
    	authDomain: "rps-multiplayer-b672d.firebaseapp.com",
    	databaseURL: "https://rps-multiplayer-b672d.firebaseio.com",
    	storageBucket: "rps-multiplayer-b672d.appspot.com",
	};

	firebase.initializeApp(config);

	var database = firebase.database();
	var playersRef = database.ref("players");

	// var turnRef = database.ref("turn");

	var chatRef = database.ref("chat");
	var oneRef = database.ref("players/1");
	var twoRef = database.ref("players/2");



	var initialDataLoaded = false;



	$("#chat").hide();

	// When player clicks start...
	$("#start").on("click", function() {

		// Get name
		var name = $('#username').val().trim();
	
		database.ref().once("value", function(snapshot) {

			// If no players are present, assign to player 1
	  		if(!snapshot.hasChild("players/1") && !snapshot.hasChild("players/2")){
	  			isPlayer1 = true;

	  			oneRef.set({
	  				choice:"",
	  				losses:0,
	  				name:name,
	  				wins:0
	  			});
	  			oneRef.onDisconnect().remove();
	  		}

	  		// If only player 1 is present, assign to player 2
	  		else if(snapshot.hasChild("players/1") && !snapshot.hasChild("players/2")){
	  			isPlayer2 = true;
	  			gameStarted = true;

	  			twoRef.set({
	  				choice:"",
	  				losses:0,
	  				name:name,
	  				wins:0
	  			});
	  			twoRef.onDisconnect().remove();

	  			// turnRef.set(0);
	  		}

	  		// If 2 players are already present, tell user game is full
	  		else{
	  			$("#name-input").text("Sorry, the game is already full. Please try again later.");
	  		}
		});

		// Don't refresh page when submit name
		return false;
	});

	// When new player is added to game...
	playersRef.on("child_added", function(snapshot){

		// If new player is player 1, display on left
		if(gameStarted == false){
			player1name = snapshot.val().name;
			$("#left-upper-text").text(snapshot.val().name);
	  		$("#left-wins").text("Wins: " + snapshot.val().wins);
	  		$("#left-losses").text("Losses: " + snapshot.val().losses);

			if(isPlayer1){
				$("#name-input").text("Hi, " + snapshot.val().name + "! You are Player 1");
	  			gameStarted = true;
			}
		}

		// If new player is player 2, display on right and start chat
		else if(gameStarted == true){
			player2name = snapshot.val().name;
			$("#right-upper-text").text(snapshot.val().name);
	  		$("#right-wins").text("Wins: " + snapshot.val().wins);
	  		$("#right-losses").text("Losses: " + snapshot.val().losses);

	  		chatRef.set({latestchat:""});
	  		$("#chat-output").val("");
	  		$("#chat").fadeIn("slow");

	  		displayLeftButtons();

			if(isPlayer2){
				$("#name-input").text("Hi, " + snapshot.val().name + "! You are Player 2");
			}
		}
	});

	// If player disconnects...
	playersRef.on("child_removed", function(snapshot){

		// turnRef.remove();

		// If player 2 disconnects (and it was not player 2 changing to player 1)...
		if(player2name == snapshot.val().name && snapshot.val().name != ""){
			
			// Remove chat from database and display that player has disconnected
			chatRef.remove();
			$("#chat-output").append($("<p>"+snapshot.val().name +" has disconnected.</p>"));
			$("#right-upper-text").text("Waiting for Player 2");
			$("#right-wins").empty();
			$("#right-losses").empty();
		}

		// If player 1 disconnected (and there is a player 2), player 2 gets assigned to player 1
		if(player1name == snapshot.val().name && player2name != ""){

			// Display player has disconnect and that user is changed to player 1
			$("#chat-output").append($("<p>"+snapshot.val().name+" has disconnected. You are now Player 1</p>"));

			// If doesn't work, move to bottom
			twoRef.update({name:""});
	  		twoRef.remove();

			isPlayer1 = true;
			isPlayer2 = false;
			gameStarted = false;
			player1name = player2name;
			player1choice = "";
			player2choice = "";

	  		oneRef.set({
	  			choice:"",
	  			losses:player2losses,
	  			name:player2name,
	  			wins:player2wins
	  		});
	  		oneRef.onDisconnect().remove();

	  		// Wait for new player
	  		$("#right-upper-text").text("Waiting for Player 2");
			$("#right-wins").empty();
			$("#right-losses").empty();
			// $("#upper-left-text").text(player1name);
		}
	
	});

	// When user chooses rock, paper, or scissors, write choice to Firebase 
	$(document).on("click","button", function(){
		var choice = $(this).data("name");

		// Increments turn in database by 1
		// turnRef.transaction(function(currentRank) {
  // 			return currentRank+1;
		// });

		if(isPlayer1)
			oneRef.update({choice:choice});
		else if(isPlayer2)
			twoRef.update({choice:choice});
	});

	// When player1 makes new choice...
	oneRef.on("child_changed", function(snapshot){
		if(snapshot.val() == "Rock" || snapshot.val() == "Paper" || snapshot.val() == "Scissors"){

			// Save to variable
			player1choice = snapshot.val();

			// Display appropriate divs
			if(isPlayer2){
				$("#turn").text("It's your turn!");
				
				displayRightButtons();
			}
			else if(isPlayer1){
				$("#left-buttons").empty();
				$("#left-buttons").html("<br><br><h1>"+player1choice+"</h1>");
				$("#turn").text("Waiting for " + player2name + " to choose.");
			}
		}		
	});

	// When player2 makes choice...
	twoRef.on("child_changed", function(snapshot){
		if(snapshot.val() == "Rock" || snapshot.val() == "Paper" || snapshot.val() == "Scissors"){

			// Save to variable
			player2choice = snapshot.val();

			// Display
			$("#right-buttons").html("<br><br><h1>"+player2choice+"</h1>");
			$("#left-buttons").html("<br><br><h1>"+player1choice+"</h1>");

			$("#middle-text").show();

			// If player 1 wins...
			if((player1choice=="Paper"&&player2choice=="Rock") || (player1choice=="Rock"&&player2choice=="Scissors") || (player1choice=="Scissors"&&player2choice=="Paper")){
				
				// Display winner
				$("#middle-text").text(player1name + " wins!");

				// Update and display wins/losses for players
				oneRef.once("value", function(snap) {
					var temp = snap.child("wins").val() + 1;
					oneRef.update({wins:temp});
					$("#left-wins").text("Wins: " + temp);
				});
				twoRef.once("value", function(snap) {
					var temp = snap.child("losses").val() + 1;
					twoRef.update({losses:temp});
					$("#right-losses").text("Losses: " + temp);
				});

				player2losses++;
			}

			// If player 2 wins...
			else if((player1choice=="Rock"&&player2choice=="Paper") || (player1choice=="Scissors"&&player2choice=="Rock") || (player1choice=="Paper"&&player2choice=="Scissors")){
				
				// Display winner
				$("#middle-text").text(player2name + " wins!");

				// Update and display wins/losses for players
				oneRef.once("value", function(snap) {
					var temp = snap.child("losses").val() + 1;
					oneRef.update({losses:temp});
					$("#left-losses").text("Losses: " + temp);
				});
				twoRef.once("value", function(snap) {
					var temp = snap.child("wins").val() + 1;
					twoRef.update({wins:temp});
					$("#right-wins").text("Wins: " + temp);
				});

				player2wins++;
			}

			// If tie, display
			else
				$("#middle-text").text("Tie game!");

			oneRef.update({choice:""});
			twoRef.update({choice:""});

			// Wait 5 seconds, then start next turn
			setTimeout(displayLeftButtons,5000);
		}
	});

	// When player clicks Send chat button...
	$("#send").on("click", function() {

		// Get user input
		var txt = $('#chat-input').val();

		// Remove from input box
		$("#chat-input").val("");

		// Remove placerholder after first chat sent
		$("#chat-input").removeAttr("placeholder");

		// Add chat to Firebase with appropriate name
		if(isPlayer1)
			chatRef.update({latestchat:player1name + ": " + txt});
		else if(isPlayer2)
			chatRef.update({latestchat:player2name + ": " + txt});

		// Don't refresh page upon sent chat
		return false;
	});

	// Upon new chat submission
	chatRef.on("child_changed", function(snapshot) {
		if(snapshot.val() != ""){

			// Append inputted text from Firebase to chat div
			$("#chat-output").append($("<p>"+snapshot.val()+"</p>"));

			// Scroll down
			$('#chat-output').animate({scrollTop: $('#chat-output').prop("scrollHeight")}, 500);

			chatRef.update({latestchat:""});
		}
	});

	function displayLeftButtons(){
		$("#middle-text").hide();
		$("#right-buttons").empty();
		$("#left-buttons").empty();
		
		if(isPlayer1){
			$("#turn").text("It's your turn!");
			$("#left-buttons").append($("<button type='button' class='btn btn-default' id='rock' data-name='Rock'>Rock</button>"));
			$("#left-buttons").append($("<button type='button' class='btn btn-default' id='paper' data-name='Paper'>Paper</button>"));
			$("#left-buttons").append($("<button type='button' class='btn btn-default' id='scissors' data-name='Scissors'>Scissors</button>"));
		}
		else if(isPlayer2){
			$("#turn").text("Waiting for " + player1name + " to choose.")
		}
	}

	function displayRightButtons(){
		$("#right-buttons").empty();
		$("#left-buttons").empty();
		$("#right-buttons").append($("<button type='button' class='btn btn-default' id='rock' data-name='Rock'>Rock</button>"));
		$("#right-buttons").append($("<button type='button' class='btn btn-default' id='paper' data-name='Paper'>Paper</button>"));
		$("#right-buttons").append($("<button type='button' class='btn btn-default' id='scissors' data-name='Scissors'>Scissors</button>"));
	}
});