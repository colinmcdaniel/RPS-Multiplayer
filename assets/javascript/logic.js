$(document).ready(function(){
	var wins = 0;
	var losses = 0;
	var turn = 1;
	var isPlayer1 = false;
	var isPlayer2 = false;
	var player1name = "";
	var player2name = "";
	var player1choice = false;
	var player2choice = false;
	var gameStarted = false;
	var config = {
		apiKey: "AIzaSyCz6aX9O3yrKDOXqAPw5-iNkP6CCAMo88Y",
    	authDomain: "rps-multiplayer-b672d.firebaseapp.com",
    	databaseURL: "https://rps-multiplayer-b672d.firebaseio.com",
    	storageBucket: "rps-multiplayer-b672d.appspot.com",
	};

	firebase.initializeApp(config);

	var database = firebase.database();
	var playersRef = database.ref("players");
	var turnRef = database.ref("turn");
	var oneRef = database.ref("players/1");
	var twoRef = database.ref("players/2");

	$("#start").on("click", function() {
		var name = $('#username').val().trim();
	
		database.ref().once("value", function(snapshot) {
	  		if(!snapshot.hasChild("players/1") && !snapshot.hasChild("players/2")){
	  			isPlayer1 = true;

	  			oneRef.set({
	  				choice:"",
	  				losses:losses,
	  				name:name,
	  				wins:wins
	  			});
	  			oneRef.onDisconnect().remove();
	  		}
	  		else if(snapshot.hasChild("players/1") && !snapshot.hasChild("players/2")){
	  			isPlayer2 = true;
	  			gameStarted = true;

	  			twoRef.set({
	  				choice:"",
	  				losses:losses,
	  				name:name,
	  				wins:wins
	  			});
	  			twoRef.onDisconnect().remove();

	  			turnRef.set(turn);
	  		}
	  		else{
	  			$("#name-input").text("Sorry, the game is already full. Please try again later.");
	  		}
		});

		return false;
	});

	// When new player is added...
	playersRef.on("child_added", function(snapshot){
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
		else if(gameStarted == true){
			player2name = snapshot.val().name;
			$("#right-upper-text").text(snapshot.val().name);
	  		$("#right-wins").text("Wins: " + snapshot.val().wins);
	  		$("#right-losses").text("Losses: " + snapshot.val().losses);

	  		displayLeftButtons();

			if(isPlayer2){
				$("#name-input").text("Hi, " + snapshot.val().name + "! You are Player 2");
			}
		}
	});

	// If player disconnects...
	playersRef.on("child_removed", function(snapshot){
		turnRef.remove();
		$("#middle-text").show();
		$("#middle-text").text("Other player disconnected. Please refresh page to begin again.");
	});

	// When user chooses rock, paper, or scissors, write choice to Firebase and increment turn
	$(document).on("click","button", function(){
		var choice = $(this).data("name");

		// Increments turn in database by 1
		turnRef.transaction(function(currentRank) {
  			return currentRank+1;
		});

		if(isPlayer1)
			oneRef.update({choice:choice});
		else if(isPlayer2)
			twoRef.update({choice:choice});
	});

	// When player1 makes choice...
	oneRef.on("child_changed", function(snapshot){
		if(snapshot.val() == "Rock" || snapshot.val() == "Paper" || snapshot.val() == "Scissors"){

			// Save to variable
			player1choice = snapshot.val();

			// Display
			if(isPlayer2){
				$("#turn").text("It's your turn!");
				
				displayRightButtons();
			}
			else if(isPlayer1){
				$("#left-buttons").empty();
				$("#left-buttons").text(player1choice);
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
			$("#right-buttons").text(player2choice);
			$("#left-buttons").text(player1choice);

			$("#middle-text").show();

			// Display winner
			if((player1choice=="Paper"&&player2choice=="Rock") || (player1choice=="Rock"&&player2choice=="Scissors") || (player1choice=="Scissors"&&player2choice=="Paper")){
				$("#middle-text").text(player1name + " wins!");

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
			}
			else if((player1choice=="Rock"&&player2choice=="Paper") || (player1choice=="Scissors"&&player2choice=="Rock") || (player1choice=="Paper"&&player2choice=="Scissors")){
				$("#middle-text").text(player2name + " wins!");

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
			}
			else
				$("#middle-text").text("Tie game!");

			oneRef.update({choice:""});
			twoRef.update({choice:""});

			setTimeout(displayLeftButtons,5000);
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