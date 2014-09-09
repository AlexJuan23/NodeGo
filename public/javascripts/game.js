
$(document).ready(function() { 
    //Canvas and context vars for the html canvas
    var canvas = document.getElementById("board"),
    context = canvas.getContext("2d");
    var xpos = GOGAME.getPositions(), //these vars hold the legal positions
    ypos =GOGAME.getPositions();	
        
    GOGAME.drawBoard(context);  //draws game board 
    GOGAME.board = GOGAME.createBoard(); //fills board array
    GOGAME.BOARD_LENGTH = GOGAME.board.length;
    GOGAME.pullData(context, canvas); //pullls data from the db
    document.getElementById('blackcaptured').value = GOGAME.blackCaptured;
    document.getElementById('whitecaptured').value = GOGAME.whiteCaptured;

    
    $('#board').click(function(e) { 
        //pulls user clicked data and passes to the first
        //game function. Also updates the html inputs
        //for captured pieces.
        var clickedX = e.pageX - this.offsetLeft,
        clickedY =e.pageY -this.offsetTop; 
        GOGAME.checkPositions(clickedX, clickedY, xpos, ypos, context, canvas);
        document.getElementById('blackcaptured').value = GOGAME.blackCaptured;
        document.getElementById('whitecaptured').value = GOGAME.whiteCaptured;
        });
    $('#reset').click(function() {
        //resets all game variables, html inputs and
        //redraws board.
        GOGAME.reset(context, canvas);
        document.getElementById('blackcaptured').value = 0;
        document.getElementById('whitecaptured').value = 0;
   
        });
    $('#save').on('click', GOGAME.saveGame); 
    $('#logout').on('click', GOGAME.logout);
        
    });
    var GOGAME = {
        BOARD_LENGTH : 0,
        board : [],
        ko : [[0,0]],
        whoseTurn : true,
        blackCaptured : 0,
        whiteCaptured : 0,
        userObject : {},
        userId : 0,
        defaultId : 0,
        userList : [],
        //logs user out by setting current user back to its default
        //value and redirecting to the home page
        logout : function() {
            $.ajax({
            type: 'PUT',
            url: '/users/currentuser/'+ GOGAME.defaultId,
            data: {'currentuser': 'default'},
            datatype: 'json'
        }).done(function(response) {
                //check for successful response
                if(response.msg ==='') {
                    alert('thanks for playing!');
                    window.location.href = '/';
                }
                else {
                    alert('Error: ' + response.msg);
                }
        });
        },
        //saves the current state of the game to the database
        saveGame : function() {
            var save = { 
                'board' : GOGAME.board,
                'blackTaken' : GOGAME.blackCaptured,
                'whiteTaken' : GOGAME.whiteCaptured,
                'whoseturn' : GOGAME.whoseTurn,
                'saved' : true,
                'ko' : GOGAME.ko  
            };
            $.ajax({
                type: 'PUT',
                url: '/users/updateuser/' + GOGAME.userObject._id,
                data: save,
                dataType: 'JSON'
            }).done(function (response) {
                if(response.msg === '') {
                    alert('Game Saved');
                }
                else {
                    alert("error: " + response.msg);
                }
            });
        },
        //pulls data from the db then populates the game board
        pullData : function(context, canvas) {
             var promise = $.getJSON('/users/userlist');
             var promise2=$.getJSON('/users/getcurrentuser/');
             promise.done(function(data) {
                GOGAME.userList = data;
                             });
             promise2.done(function(data) {
                GOGAME.userId = data[0].currentuser;
                GOGAME.board = GOGAME.loadBoard();
                GOGAME.DrawGamePiece(context, canvas);
                GOGAME.defaultId = data[0]._id;
                });
        },
        //take the loaded data from the db and fills the game variables
        loadBoard : function() {
             var arrayPosition,
             tempBoard = new Array(10);
             arrayPosition = GOGAME.userList.map(function(arrayItem) { return arrayItem._id; }).indexOf(GOGAME.userId);
             GOGAME.userObject = GOGAME.userList[arrayPosition];
                if(GOGAME.userObject.saved === 'true') {
                    for(var i = 0; i < 10; i++) {
                        tempBoard[i] =(GOGAME.userObject['board[' + i + '][]']);
                    }
                    GOGAME.blackCaptured = GOGAME.userObject.blackTaken;
                    GOGAME.whiteCaptured = GOGAME.userObject.blackTaken;
                    GOGAME.userObject.whoseturn ==='true' ? GOGAME.whoseTurn = true : GOGAME.whoseTurn = false;
                    var list = GOGAME.userObject['ko[0][]'];
                    GOGAME.ko = [list.map(function(item){return parseInt(item,10);})];
                    return tempBoard;
                }
                return tempBoard = GOGAME.createBoard();
              },
        reset : function (context, canvas) {
            GOGAME.board = GOGAME.createBoard();
            GOGAME.DrawGamePiece(context, canvas);
            GOGAME.whiteCaptured = 0;
            GOGAME.blackCaptured = 0;
            GOGAME.ko = [[0,0]];
            GOGAME.whoseTurn = true;
        },
        //function that returns all legal positions for one
        //axis
        getPositions : function() { 
            var positions = [];
            for (var i = 1; i < 10; i++) {
                positions.push(i*100);
          
            }
                return positions;
        },
        //function that checks if user input is valid move
        //If valid passes data to the next game function
        checkPositions : function(clickedX, clickedY, xpos, ypos, context, canvas) {
            var j = 0,
            i = 0;
            while(i<9) {
                //quick check to make sure user cannot place
                //game piece outside of game board
                if (clickedX < 55) {
                    break;
                }
  
                //checks value within range of valid moves 
                //since the likely hood of user clicking the 
                //exact location would be slim.
                if ((clickedX >= (xpos[i]-45) && clickedX <= xpos[i]+45) && (clickedY >= ypos[j]-45 && clickedY <= ypos[j]+45)) {    
                    //from here converts valid position to fit
                    //inside board array by dividing by 100.
                    GOGAME.PlaceGamePiece(xpos[i]/100, ypos[j]/100, context, canvas);
                    break;
                }
                if(j==8) {   
                    j = -1;
                    i++;
                    }
                j++;

                }
        },
        //main game function: checks to see if player made
        //a valid move then checks if any pieces were captured
        PlaceGamePiece : function(xPosit, yPosit, context, canvas) { 
            var captured; 
            //checks to see if the current move is in a
            //ko dispute.
            if (xPosit ==GOGAME.ko[0][0] && yPosit == GOGAME.ko[0][1]) { 
                alert("play somewhere else");
            }
            //if black's turn
            else if(GOGAME.whoseTurn && GOGAME.board[xPosit][yPosit] =="vacant") {
                //sets board location to black
                GOGAME.board[xPosit][yPosit] = "black"; 
                GOGAME.whoseTurn = false; 
                //checks to see if any white pieces are taken.
                captured = GOGAME.determineLiberties(xPosit, yPosit, "white");
                //removes any white captured pieces and adds
                //them to blacks score
                GOGAME.removePieces(captured,"white");
                //function checks whether move is a suicide move
                //and if it is won't let the position be played.
                GOGAME.isSuicide(xPosit, yPosit, "black");
            }
            //if white's turn
            else if(!GOGAME.whoseTurn && GOGAME.board[xPosit][yPosit]    =="vacant") {
                GOGAME.board[xPosit][yPosit]= "white";  
                GOGAME.whoseTurn=true;
                captured = GOGAME.determineLiberties(xPosit, yPosit, "black");
                GOGAME.removePieces(captured,"black");
                GOGAME.isSuicide(xPosit,yPosit,"white");   
            }
            //function call to redraw game board with new
            //piece/without captured pieces
            GOGAME.DrawGamePiece(context, canvas);  
         
        },  
        //creates the model for the game board
        //sets all locations to vacant
        createBoard : function() {
            var board = new Array(10);
            for(var i=0, b = board.length; i < b ; i++) {
                board[i] = new Array(10);
                for(var j=0; j < b; j++) {   
                    board[i][j]= "vacant"; 
                }
            }        
            return board;    
        },
        //function that draws the game board on the canvas
        drawBoard : function(context) { 
            for (i=1; i<10; i++) {
                context.beginPath();
                context.moveTo(100, i*100);
                context.lineTo(900, i*100);
                context.stroke();
            
                context.beginPath();
                context.moveTo(i*100, 100);
                context.lineTo(i*100, 900);
                context.stroke();
            }
        },
        //function that draws the game pieces on the canvas
        DrawGamePiece : function(context, canvas) { 
            //wipes canvas to redraw new game state
            context.clearRect(0, 0, canvas.width, canvas.height);
            GOGAME.drawBoard(context);
            //loops through board array and draws
            //the pieces it finds
            for(var i= 0; i< GOGAME.BOARD_LENGTH;i++) {
                for(var j=0; j< GOGAME.BOARD_LENGTH; j++) {
                    if( GOGAME.board[i][j] !== "vacant") {
                        context.fillStyle= GOGAME.board[i][j];
                        context.beginPath();
                        context.arc(i*100, j*100, 30, 0, 2*Math.PI);
                        context.closePath();
                        context.fill();
                        context.stroke();
                    }
                }
        
            }
        },
        //function that checks to see if stone is already
        //surrounded by opponent pieces.
        isSuicide : function(x, y, color) {   
            var liberties = new GOGAME.Liberties(x, y);
            liberties.connectedStones(color);
            liberties.countLiberties();
            var count = liberties.getLiberties();
            //if surround, returns board position to vacant
            //and allows the player to choose again.
            if(count==0) {
                GOGAME.board[x][y] = "vacant";
                GOGAME.whoseTurn =!GOGAME.whoseTurn;  
            }
        },
        //function to remove captured pieces
        removePieces : function(captured, color) {   
            //if captured length =1 than a ko
            //condition is probable so it saves this
            //position.
            if(captured.length == 1) {
                GOGAME.ko = captured;
            } else {
                GOGAME.ko=[[0,0]];
            }
            //removes captured pieces from board array
            var CAPTURED_LENGTH = captured.length;
            if (CAPTURED_LENGTH >0) { 
                for(var i=0; i < CAPTURED_LENGTH;i++) {
                    GOGAME.board[captured[i][0]][captured[i][1]]="vacant";
                }
            }
            GOGAME.incrementTaken(CAPTURED_LENGTH, color);
        },
        //function that increments the captured pieces to
        //respective variables to be displayed in the html
        //inputs
        incrementTaken : function(amount, color) {

            if(color=="black") {
                GOGAME.blackCaptured += amount;
            } 
            else if (color=="white") {
                GOGAME.whiteCaptured += amount;
            }
        },
        //function that determines liberties and connected
        //stones at a given location.
        determineLibertiesAt : function(x, y, color) {
            //checks to see if x and y coordinates are out
            //of bounds.
            if (x >= GOGAME.BOARD_LENGTH || y >= GOGAME.BOARD_LENGTH) {
                return [[],-1];
            }
            //checks to see coordinates do not return same
            //color as the capturing piece.
            if (GOGAME.board[x][y] != color) { 
                return [[], -1];
            }
            //creates new liberties object
            //then returns connected stones and the liberty
            //count for the given coordinates.
            var liberties = new GOGAME.Liberties(x, y);
            liberties.connectedStones(color);
            liberties.countLiberties();
            var connected = liberties.getConnected();
            var count = liberties.getLiberties();
            return [connected, count];
        
        },
        //determines if any pieces are captured by a given
        //set of coordinates
        determineLiberties : function(x, y, color) {
            //checks all four positions around given piece
            //and returns their connected stones and liberty
            //count.
            var liberties =[],
            captures  = [], 
            finalCaptures =[];
            liberties.push(GOGAME.determineLibertiesAt(x-1, y, color));
            liberties.push(GOGAME.determineLibertiesAt(x, y-1, color));
            liberties.push(GOGAME.determineLibertiesAt(x+1, y, color));
            liberties.push(GOGAME.determineLibertiesAt(x, y+1, color));
        
            //adds all connected stones whose liberty count is
            //zero into one list.
            for (var i =0, l=liberties.length; i < l; i++) { 
                if(liberties[i][1] == 0) {
                    captures.push(liberties[i][0]);
                }
            }

        
            //unpacks the connected stones and saves them all
            //into one list. list could contain duplicates
            for(var j =0, c=captures.length; j < c; j++) {
                var connStones = captures[j];
                for(k=0, s=connStones.length; k < s; k++) {
                    finalCaptures.push([connStones[k][0], connStones[k][1]]);
             }
            }
            //removes duplicate stones from list
            finalCaptures = GOGAME.removeDuplicates(finalCaptures);
            if( finalCaptures.length > 0) {
            return finalCaptures;
            } else {
                return [];
            }
        
        },
        //function that removes duplicate items inside
        //a list.
        removeDuplicates : function(list) {
        var temp = [],
        x, y, nextX, nextY, found;
        for(var i=0, l=list.length; i < l;i++) {
            x = list[i][0],
            y = list[i][1], 
            found = true;
            for (var j =i+1; j < l;j++) {
                nextX = list[j][0];
                nextY = list[j][1];
                if(nextX == x && nextY ==y){
                    found = false;
                    break;
                }
        
            }
            if(found){
                temp.push([x,y]);
            }
        }
        return temp;
        },
        //liberties object constructor
        Liberties : function(x, y){
            this.connected =[];
            this.left = 0;
            this.top =0;
            this.right =0;
            this.bottom =0;
            this.libertyCount =-1;
            this.stoneX = x;
            this.stoneY = y;
        
        }
    };
    //function that creates temporary board array
    //and sets all values to false.
    //to be used for searching for liberties and
    //connected stones
    GOGAME.Liberties.prototype.foundStones = function() {

        var tempBoard = new Array(10);
        for(var i=0; i< GOGAME.BOARD_LENGTH;i++) {
            tempBoard[i] =new Array(10);
            for(var j=0; j < GOGAME.BOARD_LENGTH;j++) {
                tempBoard[i][j] = false;
            }
        }
        return tempBoard;
    };
    //liberties function that finds connected stones
    //using a floodfill recursive algorithm
    GOGAME.Liberties.prototype.connectedStones = function(color) {
        var found = this.foundStones(),
        x = this.stoneX,
        y = this.stoneY,
        stone = [];
        //always returns at least one connected stone
        //itself
        //loops recursively as long as stone array has a 
        //length greater than one.
        stone.push([x, y]);
        while (stone.length > 0) {    
            x = stone[0][0]; 
            y=stone[0][1];
            stone.splice(0,1);
            //makes sure it does not check same loc twice
            found[x][y]= true;
            
            this.connected.push([x,y]);     
            //left 
            if(x-1 > 0) {
                this.left = GOGAME.board[x-1][y]; 
                if(this.left == color && found[x-1][y]== false)                 {
                    stone.push([x-1, y]); 
                } 
            }
            //top
            if(y-1 > 0) {   
                this.top = GOGAME.board[x][y-1];   
                if(this.top == color && found[x][y-1] ==false ) { 
                    stone.push([x,y-1]);  
                } 
            }
            //right
            if(x+1 < GOGAME.BOARD_LENGTH) {    
                this.right = GOGAME.board[x+1][y];
                if(this.right == color && found[x+1][y]==false)                 {
                    stone.push([x+1, y]);  
                }
            }
            //bottom
            if(y+1 < GOGAME.BOARD_LENGTH) {     
                this.bottom = GOGAME.board[x][y+1]
                if(this.bottom == color && found[x][y+1]==false)               {
                    stone.push([x, y+1]);
                }
            }
            
        }
        this.connected.sort();
    };
    //function that counts number of liberties(vacant)         //locations for a given stone
    GOGAME.Liberties.prototype.libertiesAt = function(x, y, found) {
        var libs =0;
        //left
        //checks all four locations around a give position
        if(x-1 > 0) {
                this.left = GOGAME.board[x-1][y];
                if(this.left == 'vacant' && !found[x-1][y])                 {
                    libs += 1;
                    found[x-1][y]=true;
                }
        }
        //top
        if(y-1 > 0) {
                this.top = GOGAME.board[x][y-1];
                if(this.top == 'vacant' && !found[x][y-1])                 {
                    libs += 1;
                    found[x][y-1];  
                }
        }
        //right 
        if(x+1 < GOGAME.BOARD_LENGTH) {
                this.right = GOGAME.board[x+1][y];
                if(this.right == 'vacant' && !found[x+1][y])                 {
                    libs+= 1;
                    found[x+1][y]; 
                }
        }
        //bottom
        if(y+1 < GOGAME.board.length) {
                this.bottom = GOGAME.board[x][y+1];
                if(this.bottom == 'vacant' && !found[x][y+1])                 {
                    libs+= 1;
                    found[x][y+1];
                }
        }
        return libs;
    };
    //function that returns the liberty count around a
    //stone or group of connected stone
    GOGAME.Liberties.prototype.countLiberties = function() {
        var found = this.foundStones(),
        x = 0,
        y = 0;
        this.libertyCount = 0;
        for(var i = 0,c=this.connected.length; i < c; i++) {
            x = this.connected[i][0];
            y = this.connected[i][1];
            this.libertyCount += this.libertiesAt(x, y, found);
        }
    };
    //function that returns the liberty count.
    GOGAME.Liberties.prototype.getLiberties = function() {
        return this.libertyCount;
    };
    //function that returns the connected stones.
    GOGAME.Liberties.prototype.getConnected = function() {
        return this.connected;
    };

