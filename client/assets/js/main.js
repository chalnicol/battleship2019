


   
window.onload = function () {

    var game, config, socket;

    var username = document.getElementById('username');

    username.value = 'Guest' + Math.floor ( Math.random() * 9999 );

    var form = document.getElementById ('myForm');

    form.onsubmit = function ( e ) {

        e.preventDefault();

        if ( username.value != '' ) {

            document.getElementById('game_login').style.display = 'none';
            document.getElementById('game_div').style.display = 'block';
            
            enterGame ();
        }
    }

    function enterGame () {

        var parentDiv = document.getElementById('game_div');
        
        var pW = parentDiv.clientWidth;
            pH = pW * 16/9;

        config = {

            type: Phaser.AUTO,
            width: pW,
            height: pH,
            backgroundColor: '#dedede',
            audio: {
                disableWebAudio: false
            },
            parent:'game_div',
            scene: [ SceneA, SceneB ]

        };

        game = new Phaser.Game(config);

        socket = io();

        socket.emit ('initUser', username.value );

        /* 
        if ( pW < 375 ) {
        
            var div = document.createElement ('div');
            div.innerHTML = '<p>not available to small screen sizes..<p>';
            div.style.color = 'white';
            div.style.textAlign = 'center';
    
            parentDiv.appendChild(div);
    
        }else {
            //...
        } */
    }

    var SceneA = new Phaser.Class({

        Extends: Phaser.Scene,

        initialize:

        function SceneA ()
        {
            Phaser.Scene.call(this, { key: 'SceneA' });
        },

        preload: function ()
        {
        //...
            this.load.audioSprite('sfx', 'client/assets/sfx/fx_mixdown.json', [
                'client/assets/sfx/sfx.ogg',
                'client/assets/sfx/sfx.mp3'
            ]);
            this.load.audio ('drumsofwar', [ 'client/assets/sfx/drumsofwar.ogg', 'client/assets/sfx/drumsofwar.mp3'] );
            this.load.audio ('siege', [ 'client/assets/sfx/siege.ogg', 'client/assets/sfx/siege.mp3'] );

            this.load.spritesheet('thumbs', 'client/assets/images/fleet.png', { frameWidth: 400, frameHeight: 80 });

            this.loadtxt = this.add.text ( config.width/2, config.height/2, 'Loading Game Files..', { color: '#000', fontSize: 15 }).setOrigin(0.5);

        },
        create: function ()
        {

            this.loadtxt.destroy();

            this.initializeSound();

            this.initGraphics();

            this.initSocketIOListeners();

            this.createButtons();

        },
        initSocketIOListeners :  function () {

            console.log ('listeners loaded');

            var _this = this;

            socket.on ('initGame', function ( data ) {
                
                console.log ('init game...' );

                _this.initGame (data);

            });



        },
        initializeSound :  function () {

            this.music = this.sound.addAudioSprite('sfx');

            this.introsound = this.sound.add ('drumsofwar').setVolume(0.2);
            this.introsound.play();

        },
        initGraphics : function () {

            var graphics = this.add.graphics();
            graphics.fillStyle ( 0x3c3c3c, 1);
            graphics.lineStyle ( 2, 0x9c9c9c );
            
            var width = config.width * 0.8, 
                height = config.height * 0.1, 
                x = (config.width - width)/2, 
                y = config.height*0.1;

            graphics.fillRoundedRect ( x, y, width, height, 5 );

            graphics.beginPath();
            graphics.moveTo(x, config.height*0.22);
            graphics.lineTo(x + width, config.height*0.22);
            graphics.strokePath();

            graphics.lineStyle ( 1, 0xffffff);
            graphics.beginPath();
            graphics.moveTo( x, config.height*0.221);
            graphics.lineTo( x + width, config.height*0.221);
            graphics.strokePath();

            var textHeight = Math.floor (height * 0.31);

            var txtConfig1 = { color:'#333', fontSize: textHeight, fontStyle:'bold', fontFamily:'Arial'};

            var text = this.add.text ( config.width*0.5, config.height*0.1 + height/2, 'Battleship Game', txtConfig1 ).setOrigin (0.5);
            text.setStroke('#e5e5e5', 3);
            text.setShadow( 1, 1, '#999', 1, true, true );

            var nameTxtConfig = {
                color : '#6a6a6a',
                fontSize  : config.height * 0.018,
                fontFamily : 'Trebuchet MS',
                fontStyle : 'bold'
            };

            this.nameTxt = this.add.text ( config.width/2, config.height*0.28, 'Hi,' + username.value + '!', nameTxtConfig ).setOrigin (0.5);

            var onlineCountConfig = {
                color : '#6a6a6a',
                fontSize  : config.height * 0.018,
                fontFamily : 'Trebuchet MS',
            };

            //this.onlineCount = this.add.text ( config.width *0.9, config.height*0.06, 'Players Online : 1', onlineCountConfig ).setOrigin (1, 0.5);


        },
        createButtons: function () {

            var buts = [
                { value : 'vs Computer', id: 'vscomputer'},
                { value : 'vs Online Players', id: 'vsonlineplayers'}, 
            ];

            var bW = config.width * 0.58,
                bH = config.height * 0.06,
                bS = bH * 0.2,
                sX = ( config.width - bW ) /2,
                sY = config.height * 0.35;

            this.buts = [];

            var _this = this;

            for ( var i=0; i<buts.length; i++) {

                var bute = new MyButton ( this, buts[i].id, 0, i * (bH + bS) + sY, bW, bH, buts[i].value, 0x3a3a3a ); 

                bute.on('pointerover', function () {
                    this.change( 0x4e4e4e );
                });
                bute.on('pointerout', function () {
                    this.change( 0x3a3a3a );
                });
                bute.on('pointerdown', function () {

                    //console.log ( this.id );

                    _this.music.play('clicka');

                    var isSinglePlayer = ( this.id == 'vscomputer' ) ? true : false;

                    if ( isSinglePlayer ) {

                        var initData = {

                            'isSinglePlayer' : true,
                            'isTimed' : false,
                            'players' : {
                                'self' : username.value
                            }

                        };

                        _this.initGame( initData );

                    }else {

                        _this.removeButtons();

                        _this.showWaitScreen ();

                        var toSend = {

                            'isSinglePlayer' : false,
                            'isTimed' : false
                        }

                        socket.emit ('enterGame', toSend );

                    }
                

                });

                this.tweens.add({
                    targets: bute,
                    x : config.width/2,
                    duration: 1000,
                    delay: i * 100,
                    ease: 'Elastic',
                    easeParams: [ 1, 0.5 ],
                });

                this.buts.push ( bute );

            }

        },
        showWaitScreen : function () {

            var _this = this;

            this.screenElements = [];

            var txtConfig = { color: '#000', fontSize : config.height * 0.02, fontFamily : 'Trebuchet MS' }

            var waitTxt = this.add.text ( config.width/2, config.height *0.4, 'Waiting for other player..' , txtConfig ).setOrigin(0.5);

            this.screenElements.push ( waitTxt );

            var max = 5;

            var bSize = config.width * 0.02,
                bSpace = config.width * 0.035,
                bTotal = max * ( bSize + bSpace ) - bSpace;
                bX = (config.width - bTotal) /2,
                bY = config.height * 0.44 + (bSize/2);
                
            var duration = 500, delay = duration/max;

            for ( var i=0; i<max; i++) {

                var rect = this.add.circle ( bX + i*( bSize+ bSpace), bY, bSize/2, 0x6c6c6c, 1 );
        
                this.tweens.add ({
                    targets : rect,
                    scaleX : 1.5,
                    scaleY : 1.5,
                    duration : duration,
                    ease : 'Power2',
                    repeat : -1,
                    yoyo : true,
                    delay : i * delay,
                });

                this.screenElements.push (rect);

            }

            var cW = config.width*0.45,
                cH = config.height * 0.055,
                cX = config.width/2,
                cY = config.height * 0.52;

            var bute = new MyButton ( this, 'cancel', cX, cY, cW, cH, 'Cancel', 0x3a3a3a );

            bute.on('pointerover', function () {
                this.change( 0x4e4e4e );
            });
            bute.on('pointerout', function () {
                this.change( 0x3a3a3a );
            });
            bute.on('pointerdown', function () {

                socket.emit ('leaveGame');

                _this.music.play('clicka');

                _this.removeWaitScreen();

                _this.removeButtons ();
               
                _this.createButtons();

            });

            this.buts.push ( bute );
        },
        removeWaitScreen :  function () {

            for ( var i=0;i< this.screenElements.length; i++ ) {

                this.screenElements[i].setVisible (false);

                this.screenElements[i].destroy();

            }
            this.screenElements = [];

        
        },
        removeButtons :  function () {

            for ( var i in this.buts ) {
                this.buts[i].destroy();
            }
            this.buts = [];

        },
        initGame : function ( data ) {

            socket.removeAllListeners();

            this.introsound.stop();

            this.scene.start ('SceneB', data );

        }

        
    });

    var SceneB = new Phaser.Class({

        Extends: Phaser.Scene,

        initialize:

        function SceneB ()
        {
            Phaser.Scene.call(this, { key: 'SceneB' });
        },
        init: function (data) {

            this.ship = {}; 
            this.player = {};
            this.plyrIndicator = {};
            
            this.gameData = {};

            this.cell = [];
            this.buts = [];
            this.particles = [];
            this.prompt = [];
            this.legend = [];
            
            this.trashedElements = [];

            this.gameOn = false;
            this.shipActive = '';
            this.turn = '';  
            this.view = '';
            this.blitz = false;
            this.winner = '';

            this.isSinglePlayer = data.isSinglePlayer;
            this.tmpPlayers = data.players;
            
        },
        preload: function ()
        {
            //...
        },
        create: function ()
        {

            
            this.initGameData();

            this.initSound();

            this.initPlayers();

            this.initSocketIOListeners();

            this.createPlayerIndicators ();

            this.createGrid();

            this.createFleetData();
            
            this.createFleet();

            this.createButtons();

            this.createGraphicLine ();


        },
        initSocketIOListeners : function () {

            var _this = this;

            socket.on ('opponentLeft', function ( data ) {

                if ( _this.isPrompted ) _this.removePrompt();

                _this.removeButtons ();

                _this.activateGrid (false);

                setTimeout(() => {
                    _this.showPrompt ('Opponent has left the game.', true );
                }, 200);
                
            });

            socket.on("resetGame", function () {
			
                if ( _this.isPrompted ) _this.removePrompt ();

                setTimeout (function () {
                    _this.resetGame();
                }, 200 )
                
            });


            socket.on ('gridClickResult', function (data) {

                //update data..
                for ( var i=0; i<100; i++) {
                    _this.gameData ['self'].grid [i].isTrashed = data.self.grid[i].isTrashed;
                    _this.gameData ['self'].grid [i].isResided = data.self.grid[i].isResided;

                    _this.gameData ['oppo'].grid [i].isTrashed = data.oppo.grid[i].isTrashed;
                    _this.gameData ['oppo'].grid [i].isResided = data.oppo.grid[i].isResided;
                }

                for ( var i=0; i<6; i++) {
                    _this.gameData ['self'].fleet[i].remains = data.self.fleet[i].remains;
                    _this.gameData ['oppo'].fleet[i].remains = data.oppo.fleet[i].remains;
                }

                _this.showHit ( _this.turn, data.post, data.shipIndex, data.isHit );

                _this.activateGrid (false);

                if ( data.isHit ) {

                    _this.music.play ('explosionb');

                    var opp = _this.turn == 'self' ? 'oppo' : 'self';

                    if ( data.shipSunk != null ) {
    
                        setTimeout ( function () {

                            if ( _this.turn =='self' && _this.view == 'self' ) {
                                _this.showShip ( data.shipSunk );
                            }
                            _this.music.play ('warp');
                            
                        }, 400);
                            
                    }

                    if ( data.isWinner ) {

                        _this.gameOn = false;
                        
                        setTimeout ( function () {
                            _this.endGame();
                        }, 800);

                    }else {

                        if ( _this.turn == 'self' && _this.view == 'self') {
                            setTimeout ( function () {
                                _this.activateGrid(); 
                            }, 800);
                        }
                        

                    }

                }else {

                    _this.music.play ('explosiona');

                    setTimeout ( function () {
                        _this.switchTurn ();
                    }, 1000);
                    
                }

            });

            socket.on ('startGame', function ( data ) {
                
                console.log ('data turn sent :', data );

                if ( _this.isPrompted ) _this.removePrompt();

                _this.turn = data;

                _this.startGame();

            });

            
        },
        initSound: function () {

            this.music = this.sound.addAudioSprite('sfx').setVolume (0.8);

            this.bgmusic = this.sound.add('siege').setVolume(0.2).setLoop(true);

            this.bgmusic.play();
        },
        initPlayers : function () {

            if ( this.isSinglePlayer ) {

                var oppNames = [ 'Rodrigo', 'Corazon', 'Emilio', 'Ramon', 'Fidel' ];

                var rand = Math.floor ( Math.random() * oppNames.length );

                var p1 = new Player ('self', this.tmpPlayers.self, false);
                var p2 = new Player ('oppo', oppNames [rand], true);

            }else {

                var p1 = new Player ('self', this.tmpPlayers.self, false);
                var p2 = new Player ('oppo', this.tmpPlayers.oppo, false);

            }
            
            this.player['self'] = p1;
            this.player['oppo'] = p2;
            
        },
        initGameData : function () {

            this.gameData ['self'] = { grid : [], fleet : [] };
            this.gameData ['oppo'] = { grid : [], fleet : [] };

        },
        createPlayerIndicators : function () {

            var fW = config.width*0.95,
                fH = config.height * 0.065,
                fsX = config.width/2;

            for ( var i in this.player ) {

                var yp = ( i == 'self' ) ? config.height * 0.055 : config.height * 0.8;

                var pi = new PlayerIndicator (this, i, fsX, yp, fW, fH, this.player[i].name, 3 );

                this.plyrIndicator[i] = pi;
            }
            
        },
        createGraphicLine : function ( proper = false ) {

            this.lines = this.add.graphics();

            var tw = config.width * 0.95;

            var sx = ( config.width - tw )/2,
                ex = sx + tw,
                sy = 0, ey = 0;
            
            if ( !proper ) {

                sy = config.height*0.744;
                ey = config.height*0.746;

            }else {

                sy = config.height*0.26;
                ey = config.height*0.262;

            }

            this.lines .lineStyle ( 2, 0xf5f5f5);
            this.lines .beginPath();
            this.lines .moveTo( sx, ey);
            this.lines .lineTo( ex, ey);
            this.lines .strokePath();

            this.lines .lineStyle ( 1, 0x6c6c6c );
            this.lines .beginPath();
            this.lines .moveTo( sx, sy);
            this.lines .lineTo( ex, sy);
            this.lines .strokePath(); 


        },
        createGrid: function () {

            //... create Grid ....
            var fW = config.width * 0.95 / 10,
                sfX = ( config.width - ( fW*10 ) )/2 + fW/2,
                sfY = config.height * 0.11 + ( fW/2 ); 
            
            this.fieldY = config.height * 0.11;
            this.fieldHeight = fW * 10;

            var counter = 0;

            var _this = this;

            for ( var i=0; i<10; i++) {

                for ( var j=0; j<10; j++) {
                    
                    var x = sfX + ( j * fW  ),
                        y = sfY + ( i * fW  );

                    var cll = new Cell ( this, counter, x, y, fW, fW, i, j );

                    cll.on ('pointerover', function () {
                        this.change (0x6c6c6c);
                    });
                    cll.on ('pointerout', function () {
                        this.change (0x3c3c3c);
                    });
                    cll.on ('pointerup', function () {
                        this.change (0x3c3c3c);
                    });
                    cll.on ('pointerdown', function () {

                        //console.log ( this.id );
                        if ( _this.gameOn ) {

                            this.disableInteractive();

                            if ( _this.isSinglePlayer ) {

                                _this.makePick ( this.id );

                            }else {

                                socket.emit ('gridClicked', this.id );

                            }
                           
                        }else {

                            if ( _this.shipActive != '' ) {

                                var ship = _this.ship [ _this.shipActive ];

                                var oldPost = ship.post, newPost = this.id;

                                _this.updateGrid( oldPost, ship.rot, ship.len, ship.player, -1, false );

                                var checkLocation =  _this.checkPost( newPost, ship.rot, ship.len, ship.player ); 

                                if ( checkLocation ) {

                                    _this.music.play('move');

                                    _this.gameData ['self'].fleet [ ship.index ].post = this.id;

                                    _this.updateGrid( newPost, ship.rot, ship.len, ship.player, ship.index, true );

                                    var mygrid = _this.gameData['self'].grid[this.id];

                                    ship.x = (ship.rot==1) ? mygrid.x : mygrid.x + ship.width/2 - ship.size/2,
                                    ship.y = (ship.rot==0) ? mygrid.y : mygrid.y + ship.height/2 -ship.size/2;

                                    ship.post = this.id;

                                }else {

                                    _this.music.play('error');

                                    _this.updateGrid( oldPost, ship.rot, ship.len, ship.player, ship.index, true );

                                    _this.shakeship ( ship );
                                }

                            }else {

                                console.log ('nothing to do...');

                            }
                        }

                    });

                    this.cell.push (cll);

                    //initialize grid...

                    var self = new MyGrid ( x, y, i, j, counter ); 
                    this.gameData['self'].grid.push ( self );

                    var oppo = new MyGrid ( x, y, i, j, counter );
                    this.gameData['oppo'].grid.push ( oppo );
                    
                    counter++;
                    
                }
            }

        },
        createFleetData : function ( player='self' ) {

            //console.log ('add me..');
            var fleetArr = [ 
                { len : 5, id:'carr', code : 'carrier'}, 
                { len : 4, id:'batt', code : 'battleship'}, 
                { len : 3, id:'crui', code : 'cruiser'}, 
                { len : 3, id:'subm', code : 'submarine'}, 
                { len : 2, id:'des0', code : 'destroyer'}, 
                { len : 2, id:'des1', code : 'destroyer'}
            ];

            var counterCheck = 0;

            for ( var i=0; i<fleetArr.length;i++) {

                var locationGood = false, post = 0,  rot = 0;

                var _this = this;
 
                var openGrid = this.getOpenGrid(player);

                while ( !locationGood ) {

                    counterCheck++;

                    var rand = Math.floor ( Math.random() * openGrid.length );

                    post = openGrid [ rand ];

                    rot = Math.floor ( Math.random() * 2 );

                    locationGood = this.checkPost( post, rot, fleetArr[i].len, player );

                    if ( locationGood ) {

                        this.updateGrid ( post, rot, fleetArr[i].len, player, i, true );

                        this.gameData[player].fleet.push ({

                            'id' : player + '_' +  fleetArr[i].id,
                            'length' : fleetArr[i].len,
                            'remains' : fleetArr[i].len,
                            'rotation' : rot,
                            'post' : post,
                            'code' : fleetArr[i].code,
                            'index' : i,

                        });

                    }//...

                }//endwhile..

            }

            console.log ('data created', player, counterCheck );

        },
        createFleet : function ( player='self') {
            
            var _this = this;

            var size = config.width * 0.95 / 10;

            var fleetData = this.gameData[player].fleet;

            
            for ( var i=0; i<fleetData.length;i++) {

                var rot = fleetData[i].rotation, 
                    len = fleetData[i].length,
                    post = fleetData[i].post ;

                var width = ( rot == 0 ) ? size * len : size,
                    height = ( rot == 1 ) ? size * len : size;

                var mygrid = this.gameData[player].grid[ post ];

                var xp = (rot==1) ? mygrid.x : mygrid.x + width/2 - size/2,
                    yp = (rot==0) ? mygrid.y : mygrid.y + height/2 -size/2;

                var isHidden = ( player=='oppo' ) ? true : false;

                var ship = new Ship ( this, fleetData[i].id, xp, yp, width, height, size, rot, len, fleetData[i].code, player, post, i, !isHidden ).setAlpha(0); 

                this.ship[ fleetData[i].id ] = ship;

                var shipActiveColor = 0xffff99; //0x66ff33

                ship.on ('pointerdown', function() {


                    if ( this.isActive ) {
                        
                        var oldRot = this.rot, newRot = ( oldRot == 0 ) ? 1 : 0;

                        _this.updateGrid( this.post, oldRot, this.len, player, -1, false );

                        
                        var checkLocation =  _this.checkPost( this.post, newRot, this.len, player ); 
    

                        if ( checkLocation ) {

                            _this.music.play('clickc');

                            _this.updateGrid( this.post, newRot, this.len, player, this.index, true );
                            
                            _this.gameData ['self'].fleet [ this.index ].rotation = newRot;

                            this.rot = newRot;
    
                            this.width = ( this.rot == 0 ) ? size * this.len : size,
                            this.height = ( this.rot == 1 ) ? size * this.len : size;
    
                            var mygrid = _this.gameData ['self'].grid [ this.post ];

                            this.x = (this.rot==1) ? mygrid.x : mygrid.x + this.width/2 - this.size/2,
                            this.y = (this.rot==0) ? mygrid.y : mygrid.y + this.height/2 - this.size/2
    
                            this.changeRotation();
                            
                            this.changeBackground ( shipActiveColor );
                            
                        } else {
                            
                            _this.updateGrid( this.post, oldRot, this.len, player, this.index, true );

                            _this.music.play('error');

                            _this.shakeship(this);
                        };

                    }else {
                        
    
                        if ( _this.shipActive != '' && _this.shipActive != this.id ) {
    
                            var ship = _this.ship[_this.shipActive];
    
                            ship.reset();
    
                            _this.updateGrid( ship.post, ship.rot, ship.len, ship.player, ship.index, true );

                        } 
    
                        _this.shipActive = this.id;

                        _this.music.play('pick');
    
                        this.isActive = true;
    
                        this.changeBackground ( shipActiveColor );
    
                    }
    
                });
    
                this.tweens.add ({
                    targets : ship,
                    alpha : 1,
                    duration : 1000,
                    ease : 'Power2'
                });

            }
            

           

            
            //Create ships...
           
            

            
            
            

        },
        createButtons : function ( proper = false ) {

            this.removeButtons();
            //buttons...

            this.music.play ('move');

            if ( !proper ) {
                var buttonTexts = [ { id : 'leave', val: '✘ Leave' },
                                    { id : 'random', val: '❉ Random' },
                                    { id : 'ready', val: '❖ Ready' }];
            }else {
                var buttonTexts = [ { id : 'leave', val: '✘ Leave Game' },
                                    { id : 'switch', val: '➦ Switch Field' }];
            }
            
            var totalW = config.width * 0.95; 

            var btnS = config.width * 0.015,

                btnW = ( totalW - ( (buttonTexts.length-1) * btnS ) ) / buttonTexts.length ,

                btnH = config.height * 0.055,
                
                bfX = ( config.width - totalW )/2 + btnW/2,

                bfY = (!proper) ? config.height * 0.69 : config.height * 0.95; 

            var _this = this;

            for ( var i=0; i<buttonTexts.length; i++) {
                
                var but = new MyButton ( this, buttonTexts[i].id, 0, bfY, btnW, btnH, buttonTexts[i].val, 0x6c6c6c );

                this.buts.push ( but );

                but.on ('pointerup', function () {
                    this.change (this.bgColor);
                });
                but.on ('pointerover', function () {
                    this.change (0x9c9c9c);
                });
                but.on ('pointerout', function () {
                    this.change (this.bgColor);
                });
                but.on ('pointerdown', function () {

                    this.change (0xff3333);

                    _this.music.play('clicka');

                    switch (this.id) {

                        case 'random' : 
                            _this.randomFleet();
                        break;
                        case 'ready' : 

                            _this.readyFleet();
                            
                        break;
                        case 'leave' : 
                            //..
                            _this.leaveGame();
                        break;
                        case 'switch' : 
                            //...
                            //this.disableInteractive();
                            _this.switchView ();
                        
                        break;
                        default:
                            //..
                    }
                    
                });
                

                this.tweens.add ( {
                    targets: but,
                    x : bfX + i * ( btnW + btnS ),
                    duration : 300,
                    ease : 'Power2'
                });

            }
                

        },
        removeButtons: function () {

            for ( var i in this.buts ) {

                this.buts[i].disableInteractive();

                this.tweens.add ( {
                    targets: this.buts[i],
                    x : config.width + this.buts[i].width,
                    duration : 300,
                    ease : 'Power2',
                    onComplete : function () {
                        this.targets[0].destroy();
                    }
                }); 
            }
            this.buts = [];
        
        },
        randomFleet: function () {
            
            //start random...
            for ( var i in this.ship ) {
                this.ship[i].destroy();
            }
            this.ship = [];

            for ( var i in this.gameData['self'].grid ) {
                this.gameData['self'].grid[i].isResided = false;
            }

            this.gameData['self'].fleet = [];

            this.createFleetData();
            this.createFleet();

        },
        readyFleet: function () {

            if ( this.shipActive != '' ) {

                var ship = this.ship[this.shipActive];

                ship.reset();

                this.updateGrid( ship.post, ship.rot, ship.len, ship.player, ship.index, true );
            } 

            this.shipActive = '';

            for ( var i in this.ship ) {
                this.ship[i].disableInteractive ();
            }

            for ( var i in this.buts ) {
                this.buts[i].disableInteractive ();
            }

            this.activateGrid (false);

            this.createFleetData ('oppo');

            if ( !this.isSinglePlayer ) {

                var fleetData = this.gameData['self'].fleet;

                socket.emit ('playerReady', fleetData );

                this.showPrompt('Waiting for other player..');

            }else {

                this.turn = this.winner == 'self' ? 'oppo' : 'self' ;

                this.startGame();

            }

        },
        getOpenGrid: function (plyr) {

            var tmp = [];

            var grid = this.gameData[plyr].grid;

            for ( var i=0; i<grid.length; i++) {
                
                var adjCount = 0;

                var adj = this.getAdjacent ( i, plyr );

                for ( var j=0; j<adj.length; j++ ) {
                    if ( grid[ adj[j].post ].isResided ) adjCount++;
                }

                if ( !grid[i].isResided && adjCount == 0 ) tmp.push (i);
            };

            return tmp;

        },
        getAdjacent: function ( post, plyr='self') {

            var tmp=[];

            var grid = this.gameData[plyr].grid;

            var left = post - 1;
            if ( left >=0 && grid[left].row == grid[post].row ) 
            {
                tmp.push ({ dir: 'left', post : left });
            }

            var right = post + 1;
            if ( right < 100 && grid[right].row == grid[post].row ) 
            {
                tmp.push ({ dir: 'right', post : right });
            }
               

            var top = post - 10;
            if ( top >= 0 && grid[top].col == grid[post].col ) 
            {
                tmp.push ({ dir: 'top', post : top });
            }
                
            
            var bottom = post + 10;
            if ( bottom < 100 && grid[bottom].col == grid[post].col ) 
            {
                tmp.push ({ dir: 'bottom', post : bottom });
            }
                

            return tmp;
            
        },
        checkPost : function ( gridPost, rot, len, plyr ) {

            var origin = gridPost;

            var mygrid = this.gameData[plyr].grid;

            for ( var i=0; i<len; i++) {

                if ( gridPost > 99 )  {
                    return false;
                }
                if ( mygrid[gridPost].isResided )  {
                    return false;
                }

                
                //check adjacents..
                var adj = this.getAdjacent ( gridPost, plyr );
                
                for ( var j=0; j <adj.length; j++) {
                    if ( mygrid[ adj[j].post].isResided ) {
                        return false;
                    }
                }
                

                if ( rot == 0 ) {
                    if ( mygrid[gridPost].row != mygrid[origin].row )  {
                        return false;
                    }
                    gridPost++;

                }else {

                    if ( mygrid[gridPost].col != mygrid[origin].col ) {
                        return false;
                    } 
                    gridPost += 10;
                }

            } 
            
            return true;

        },
        updateGrid: function ( post, rot, len, plyr, index, val=false,  ) {

    
            for ( var i=0; i<len; i++) {

                this.gameData[plyr].grid[post].isResided = val;

                this.gameData[plyr].grid[post].index = index;
                
                if ( rot == 0 ) {
                    post++;
                }else {
                    post += 10;
                }
            } 

        },
        startGame: function () {

            this.gameOn = true;
        
            this.view = 'self';

            this.removeButtons();

            this.moveField ();

            this.moveFleet ();

            this.showFleet();

            this.showField ();

            this.showLegends();

            var _this = this;

            setTimeout ( function () {

                _this.plyrIndicator [ _this.turn ].isTurn( true );

                _this.createButtons ( true );

                _this.activateGrid( _this.turn == 'self' );

                if (_this.isSinglePlayer && _this.turn == 'oppo') _this.autoPick();

            }, 800 );
            
        },
        switchView : function () {

            this.view = (this.view == 'self') ? 'oppo' : 'self';

            this.removeTrashedElements();

            this.showFleet();

            this.showField ();

            this.showLegends();

            this.activateGrid( this.turn == 'self' && this.view == 'self' );
        
            //...

        },
        switchTurn: function () {

            this.turn = (this.turn == 'self') ? 'oppo' : 'self';

            this.music.play('message');

            this.plyrIndicator['self'].isTurn ( this.turn == 'self' );
            this.plyrIndicator['oppo'].isTurn ( this.turn == 'oppo');
            
        
            if ( this.isSinglePlayer ) {

                var _this = this;

                if ( this.turn == 'oppo') {

                    setTimeout( function () {
                        _this.autoPick();
                    }, 1000);

                }else {

                    if ( this.view == 'self') {
                        this.activateGrid();
                    }
                }

            }else {

                if ( this.turn == 'self' && this.view == 'self' ) this.activateGrid();

            }
            
        },
        createAnim : function ( x, y, hit=false ) {

            if ( hit ) {

                var cnt = 96;

                //var deg = 360/cnt;

                var pW = config.width * 0.008;

                var gSize = (config.width * 0.95 / 10) * 0.5;

                var color = new Phaser.Display.Color();

                for ( var i=0; i<cnt; i++ ) {

                    color.random(50);

                    var len = Math.floor ( Math.random() * gSize );

                    var deg = Math.floor ( Math.random() * 360 );

                    var xp = x + Math.cos ( Math.PI/180 * deg ) * len,
                        yp = y - Math.sin ( Math.PI/180 * deg ) * len; 

                    var rect = this.add.star (xp, yp, 5, pW, pW*2, color.color );

                    var dest = Math.floor ( Math.random() * 150 );

                    this.tweens.add ({

                        targets : rect,

                        x: { value: x + Math.cos ( Math.PI/180 * deg ) * dest, duration: 1000, ease: 'Cubic.easeOut' },
                        y: { value: y + Math.sin ( Math.PI/180 * deg ) * dest, duration: 1000, ease: 'Cubic.easeOut' },
                        alpha: { value: 0, duration: 1000, ease: 'Cubic.easeOut' },

                        onComplete : function () {
                            this.targets[0].destroy();
                        }
                    });

                }

            }else {

                var radius = 10;

                //not hit...
                for ( var i=0; i<3; i++) {

                    var circ = this.add.circle ( x, y , radius );
                    circ.setStrokeStyle ( 2, 0xcccccc, 0.8 );

                    this.tweens.add ({

                        targets : circ,

                        scaleX : 3.5,
                        scaleY : 3.5,
                        alpha : 0,
                        ease  : 'Power3',
                        delay : i * 150,
                        onComplete : function () {
                            this.targets[0].destroy();
                        }
                        
                    });
                }

            }
            
        },
        isHit: function ( gridPost, opp ) {
            
            if ( this.gameData[opp].grid[gridPost].isResided ) {
                return true;
            }

            return false;
        },
        moveField: function ( reset=false) {

            this.lines.clear();

            this.createGraphicLine ( !reset );

            var toAdd = ( config.height * 0.263 );

            if ( !reset ) {
                
                for ( var i in this.cell ) {

                    this.cell [i].y += toAdd;
    
                    this.gameData ['self'].grid [i].y = this.cell [i].y;
                    this.gameData ['oppo'].grid [i].y = this.cell [i].y;
                    
                }

            }else {

                for ( var i in this.cell ) {

                    this.cell [i].y += -toAdd;
    
                    this.gameData ['self'].grid [i].y = this.cell [i].y;
                    this.gameData ['oppo'].grid [i].y = this.cell [i].y;
                    
                }

                this.plyrIndicator ['oppo'].y = config.height * 0.8;

            }

        },
        moveFleet : function () {

            var size = config.width * 0.95 / 10;

            for ( var i in this.ship ) {

                var rot = this.ship[i].rot, 
                    len = this.ship[i].len,
                    post = this.ship[i].post ;

                var width = ( rot == 0 ) ? size * len : size,
                    height = ( rot == 1 ) ? size * len : size;

                var cell = this.cell [ post ];

                var xp = (rot==1) ? cell.x : cell.x + width/2 - size/2,
                    yp = (rot==0) ? cell.y : cell.y + height/2 -size/2;

                this.ship[i].y = yp;
            
            }

        },
        showFleet : function () {

            for ( var i in this.ship ) {
                
                var ship = this.ship[i];

                ship.disableInteractive();

                if ( ship.player != this.view ) {
                    ship.setVisible ( true );
                }else {
                    ship.setVisible ( false );
                }
                
            }

        },
        showField : function () {

            var top = config.height * 0.055;
                bot = config.height * 0.32;

            this.plyrIndicator['self'].y = ( this.view == 'self' ) ? top : bot;
            this.plyrIndicator['oppo'].y = ( this.view == 'oppo' ) ? top : bot;

            this.tweens.add ({
                targets : [this.plyrIndicator['self'], this.plyrIndicator['oppo']],
                y : '+=5',
                duration : 100,
                alpha : 0,
                ease : 'Bounce.easeOut',
                easeParams : [1.0, 0.5 ],
                yoyo:true,
            });

            var other = this.view == 'self' ? 'oppo' : 'self';

            var mygrid = this.gameData[ other ].grid;

            for ( var i=0; i<mygrid.length; i++ ) {
                if ( mygrid[i].isTrashed ) {
                    this.fillTrashed ( mygrid[i].x, mygrid[i].y, mygrid[i].isResided)
                }
            }

        },
        showPrompt : function ( txt='', leave=false ) {

            if ( this.isPrompted ) this.removePrompt();

            this.isPrompted = true;

            var pW = config.width * 0.75,
                pH = config.height * 0.15,
                pX = (config.width - pW)/2,
                pY = config.height * 0.3;

            this.readyGraphic = this.add.graphics().setDepth (9999);

            this.readyGraphic.fillStyle ( 0x0a0a0a, 0.5 );
            this.readyGraphic.fillRect ( 0, 0, config.width, config.height );

            this.readyGraphic.fillStyle ( 0xf4f4f4, 0.8 );
            this.readyGraphic.lineStyle ( 1, 0x9c9c9c );

            this.readyGraphic.fillRoundedRect ( pX, pY, pW, pH, pH * 0.05 );
            this.readyGraphic.strokeRoundedRect ( pX, pY, pW, pH, pH * 0.05 );
            
            var txtConfig = { 
                fontFamily: 'Arial', 
                fontStyle : 'bold',
                fontSize: pW * 0.05, 
                color: '#000' 
            };

            var ty = ( !leave ) ? pY + pH/2 : pY + pH * 0.3;

            this.readyTxt = this.add.text ( config.width/2, ty, txt, txtConfig ).setOrigin(0.5).setDepth (9999);

            if ( leave ) {

                var bw = pW * 0.5,
                    bh = pH * 0.3,
                    bx = pX + ( pW - bw )/2 + (bw/2),
                    by = pY + pH * 0.55 + (bh/2);

                var but = new MyButton ( this, 'but', bx, by, bw, bh, 'Leave Game' ).setDepth (9999);;

                var _this = this;

                but.on ('pointerup', function () {
                    this.change (this.bgColor);
                });
                but.on ('pointerover', function () {
                    this.change (0x9c9c9c);
                });
                but.on ('pointerout', function () {
                    this.change (this.bgColor);
                });
                but.on ('pointerdown', function () {

                    socket.emit ('leaveGame', null );
                    _this.leaveGame();
                    
                });

                this.buts.push ( but );
            }

        },
        showLegends: function () {

            //..reset...
            this.removeLegends ();
            
            //..reset...
            var totalW = config.width * 0.95; 

            var legXS = config.width * 0.016,
                legYS = config.height * 0.012,
                legW = ( totalW - ( 2 * legXS ) ) / 3,
                legH = config.height * 0.053,
                legX = ( config.width - totalW )/2 + legW/2,
                legY = config.height * 0.14; 

            var fleetData = this.gameData[ this.view ].fleet;

            for ( var i=0; i<fleetData.length; i++ ) {

                    var xp = Math.floor ( i/3 );
                        yp = i % 3;
                   
                    var rems = ( this.view !='oppo' && fleetData[i].remains > 0 ) ? fleetData[i].length : fleetData[i].remains;

                    var lege = new Legend ( this, 'ship'+i, -legW, legY + xp * (legH + legYS), legW, legH, this.view, fleetData[i].code, fleetData[i].length, rems );

                    this.legend.push ( lege );

                    this.tweens.add ({
                        targets : lege,
                        x : legX + yp * (legW + legXS),
                        duration : 300,
                        delay : xp * 80,
                        ease : 'Sine.easeIn',
                        //easeParams : [ 1, 0.5 ]
                    }); 
            } 
                
        },
        fillTrashed : function (x, y, hit=false) {

            var size = config.width*0.95/10;

            var rectColor = hit ? 0x33cccc : 0xf5f5f5;
            var rect = this.add.rectangle (  x , y, size, size ,rectColor, 0.4 ).setDepth(999);
            
            var circColor = hit ? 0xff0000 : 0xffcc33;
            var circ = this.add.circle ( x, y, size * 0.12, circColor, 0.7 ).setDepth(999);
            circ.setStrokeStyle ( 1, 0x3a3a3a );

            this.trashedElements.push ( rect );
            this.trashedElements.push ( circ );
            
        },
        showShip : function ( data ) {
        
            var fleetData = this.gameData['oppo'].fleet[ data.index ];

            var size = config.width * 0.95 / 10;

            var rot = data.rotation, 
                len = data.length,
                post = data.post ;

            var width = ( rot == 0 ) ? size * len : size,
                height = ( rot == 1 ) ? size * len : size;

            var mygrid = this.gameData['oppo'].grid[ post ];

            var xp = (rot==1) ? mygrid.x : mygrid.x + width/2 - size/2,
                yp = (rot==0) ? mygrid.y : mygrid.y + height/2 -size/2;

            var ship = new Ship ( this, fleetData.id, xp, yp, width, height, size, rot, len, fleetData.code, 'oppo', post, fleetData.index, true );

            this.ship[ ship.id ] = ship;


        },
        shakeship : function ( trget ) {

            

            this.tweens.add ({
                targets: trget,
                scaleX : 1.1,
                scaleY : 1.1,
                duration : 100,
                yoyo: true,
                ease : 'Elastic'
            });

        },
        autoPick: function  () {

            var opp = (this.turn == 'self') ? 'oppo' : 'self';

            var plyr = this.player[this.turn];

            if ( plyr.pickOrigin == -1 ) {

                var random = this.randomPick ( opp );

                //console.log ('random pick', random);

                this.makePick ( random );

            }else {

                if ( plyr.pickOrigin == plyr.lastGoodPick ) {

                    //console.log ('pick adjacent');

                    var adj = this.getAdjacent( plyr.lastGoodPick, opp );

                    var tmpAdj = [];

                    for ( var i = 0; i < adj.length; i++) {

                        if ( !this.gameData[opp].grid[ adj[i].post ].isTrashed ) {
                            
                            tmpAdj.push ( adj[i] );
                        }

                    }

                    var rand_index = Math.floor ( Math.random() * tmpAdj.length );

                    plyr.pickDirection = tmpAdj[rand_index].dir;

                    this.makePick ( tmpAdj[rand_index].post );


                }else {

            
                    var nextPick = 0, reversePick = 0, revDir = '';

                    switch ( plyr.pickDirection ) {

                        case 'left' : 

                            nextPick = plyr.lastGoodPick - 1;

                            reversePick = plyr.pickOrigin + 1;

                            revDir = 'right';

                        break;
                        case 'right' : 

                            nextPick = plyr.lastGoodPick + 1;

                            reversePick = plyr.pickOrigin - 1;

                            revDir = 'left';

                        break;
                        case 'top' : 

                            nextPick = plyr.lastGoodPick - 10;

                            reversePick = plyr.pickOrigin + 10;

                            revDir = 'bottom';

                        break;
                        case 'bottom' : 

                            nextPick = plyr.lastGoodPick + 10;

                            reversePick = plyr.pickOrigin - 10;

                            revDir = 'top';

                        break;

                    }

                    var forward = this.checkPick ( plyr.pickDirection, plyr.pickOrigin, nextPick, opp );

                    var reverse = this.checkPick ( revDir, plyr.pickOrigin, reversePick, opp  );

                    if ( forward ) {

                        //console.log ('going forward', plyr.pickDirection, nextPick );

                        this.makePick ( nextPick );

                    }else if ( reverse ) {

                        //console.log ('going reverse', revDir, reversePick );

                        plyr.pickDirection = revDir;

                        this.makePick ( reversePick );

                    }else {

                        console.log ( 'ewan ko na lang.. wala pa' );
                    }
                    //..
                }

            }
            
        },
        checkPick : function ( dir, op, np, opp ) {

            if ( np < 0 || np >= 100 ) return false;
            
            if ( dir == 'left' || dir == 'right') {
                if ( this.gameData[opp].grid[op].row != this.gameData[opp].grid[np].row ) return false;
            }
            if ( dir == 'top' || dir == 'bottom') {
                if ( this.gameData[opp].grid[op].col != this.gameData[opp].grid[np].col ) return false;
            }

            if ( this.gameData[opp].grid[np].isTrashed ) return false;

            return true;

        },
        randomPick : function ( opp ) {

            var tmpArr = [];

            var grid = this.gameData [ opp ].grid;

            for ( var i=0; i<grid.length; i++ ) {

                var adj = this.getAdjacent ( i, opp );

                var counter = 0; 
                for ( var j = 0; j < adj.length; j++ ) {
                    if ( grid[ adj[j].post].isTrashed && grid[ adj[j].post ].isResided ) {
                        counter++;
                    }
                }

                if ( !grid[i].isTrashed && counter == 0 ) {
                    tmpArr.push ( i );
                }

            }

            var index = Math.floor ( Math.random() * tmpArr.length );

            return tmpArr [index];

        },
        makePick: function ( gridPost ) {

            var opp = ( this.turn == 'self' ) ? 'oppo' : 'self';

            var isHit = this.isHit ( gridPost, opp );

            var mygrid = this.gameData[opp].grid[gridPost];

            mygrid.isTrashed = true;

            this.player[this.turn].isLastPickGood = isHit;

            this.showHit ( this.turn, gridPost, mygrid.index, isHit );

            this.activateGrid (false);

            var _this = this;

            if ( !isHit ) {

                this.music.play ('explosiona');

                setTimeout ( function () {
                    _this.switchTurn ();
                }, 1000);
                
            }else {

                this.music.play ('explosionb');

                if ( this.player[this.turn].pickOrigin == -1 ) {
                    this.player[this.turn].pickOrigin = gridPost;
                }

                this.player[this.turn].lastGoodPick = gridPost;

                var fleet = this.gameData[ opp ].fleet [ mygrid.index ];

                fleet.remains += -1;

                if ( fleet.remains == 0 ) {

                    setTimeout ( function () {

                        if ( _this.turn =='self' && _this.view == 'self' ) {
                            _this.showShip ( fleet );
                        }
                        _this.music.play ('warp');
                        
                    }, 400);
                        
                    this.player[this.turn].pickOrigin = -1;
                }

                var isWinner = this.checkWinner();

                if ( isWinner ) {

                    this.gameOn = false;
                    setTimeout ( function () {
                        _this.endGame();
                    }, 800);
                    
                }else {
    
                    if ( this.turn == 'oppo' ) {

                        setTimeout ( function () {
                            _this.autoPick();
                        }, 1300);
    
                    }else {

                        setTimeout ( function () {
                            _this.activateGrid(); 
                        }, 800);

                    }
                    
                }

            }


        },
        showHit : function ( player, post, shipIndex, isHit ) {

            //...............
            var pi = this.plyrIndicator[player];
            var x = config.width * 0.92,
                y = pi.y + pi.height * 0.2,
                r = config.width * 0.08;

            var bgcolor = !isHit ? 0xff6666 : 0x33cc33;

            this.hitStar = this.add.star ( x, y, 30, r*0.85, r, bgcolor, 0.9 ).setScale(0.3).setStrokeStyle ( 1, 0x9c9c9c, 0.9  );
            var txt = isHit ? 'Hit' : 'Miss';

            var hitTextConfig = { color : '#fff', fontSize : r/2, fontFamily : 'Trebuchet MS' };

            this.hitText = this.add.text ( x, y, txt, hitTextConfig ).setOrigin (0.5).setScale(0.3).setRotation ( Math.PI/180 * 45 );

            this.tweens.add ({
                targets : [this.hitStar, this.hitText],
                //rotation : Math.PI/180 * 45,
                scaleX : 1,
                scaleY : 1,
                duration : 200,
                ease : 'Elastic',
                easeParams : [ 1.5, 0.5 ]
            });

            var _this = this;
            setTimeout ( function () {
                _this.hitStar.destroy();
                _this.hitText.destroy();
            }, 500 );


            if ( this.turn == this.view ) {
                
                var cell = this.cell [ post ];

                this.fillTrashed ( cell.x, cell.y, isHit );
                
                this.createAnim ( cell.x, cell.y, isHit );

            }else {

                if ( isHit ) {
                
                    var legend = this.legend [ shipIndex ];

                    legend.updateRems();

                    this.createAnim( legend.x, legend.y, true );

                }

            }

        },
        activateGrid : function ( enabled=true ) {

            if ( !enabled) {

                for ( var i=0; i< this.cell.length; i++ ) {
                    this.cell[i].disableInteractive();
                }

            }else {

                var opp = ( this.turn == 'self' ) ? 'oppo' : 'self';

                for ( var i=0; i< this.cell.length; i++ ) {
                    
                    if ( !this.gameData[opp].grid[i].isTrashed) {

                        this.cell[i].setInteractive();

                    }
                }

            }
            ///...

        },
        checkWinner: function () {

            var opp = this.turn == 'self' ? 'oppo' : 'self';

            var fleet = this.gameData[opp].fleet;

            for ( var i in fleet ) {
                if ( fleet[i].remains > 0 ) {
                    return false;
                }
            }
            return true;

        },
        endGame: function () {

            this.gameOn = false;

            this.removeButtons();
            
            var winner = this.turn;

            this.player [ winner ].wins += 1;

            this.winner = winner;

            var _this = this;

            setTimeout ( function () {
                
                _this.plyrIndicator [winner].updateWins ( _this.player [ winner ].wins );

                _this.showEndScreen ( winner );

            }, 300 );
            

        },
        showEndScreen: function ( winner='self') {

            this.isEndScreen = true;

            this.music.play('alternate');

            var txt = winner == 'self' ? 'Congrats! You win.' : 'Sorry, You lose.'

            var pW = config.width * 0.75,
                pH = config.height * 0.22,
                pX = (config.width - pW)/2,
                pY = this.fieldY + (( this.fieldHeight - pH ) / 2);

            this.endGraphic = this.add.graphics().setDepth(9999);

            this.endGraphic.fillStyle ( 0x0a0a0a, 0.5 );
            this.endGraphic.fillRect ( 0, 0, config.width, config.height );

            this.endGraphic.fillStyle ( 0xf4f4f4, 0.8 );
            this.endGraphic.lineStyle ( 1, 0x9c9c9c );

            this.endGraphic.fillRoundedRect ( pX, pY, pW, pH, pH * 0.05 );
            this.endGraphic.strokeRoundedRect ( pX, pY, pW, pH, pH * 0.05 );
            
            var txtConfig = { 
                fontFamily: 'Arial', 
                fontStyle : 'bold',
                fontSize: pW * 0.08, 
                color: '#000' 
            };

            this.endtext = this.add.text ( config.width/2, pY + pH * 0.35, txt, txtConfig ).setOrigin(0.5).setDepth ( 9999 );

            var buts = ['Leave', 'Rematch'];

            var bW = pW * 0.4,
                bH = pH * 0.22,
                bS = bW * 0.08,
                btW = bW * 2 + bS,
                bX = pX + (( pW - btW )/2) + (bW/2),
                bY = pY + pH * 0.65 + (bH/2);

            var _this = this;

            this.endButs = [];

            for ( var i=0; i < buts.length; i++ ) {

                var but = new MyButton (this, 'buts' + i, bX + i * (bW + bS), bY, bW, bH, buts[i] ).setDepth(9999);

                but.on('pointerover', function () {
                    this.change (0x6c6c6c);
                });
                but.on('pointerout', function () {
                    this.change(0x3c3c3c);
                });
                but.on('pointerdown', function () {

                    _this.music.play ('clicka')
            
                    this.change (0xff3333);
                    switch ( this.id ) {
                        case 'buts0' :
                            _this.leaveGame();
                        break;
                        case 'buts1' :
                        
                            if ( _this.isEndScreen ) _this.removeEndScreen();

                            setTimeout ( function () {
                                
                                socket.emit ('rematchRequest', null );

                                _this.showPrompt ('Waiting for other player');

                            }, 200);
                            
                        break;
                    }
                });
                but.on('pointerup', function () {
                    this.change(0x3c3c3c);
                });

                this.endButs.push ( but );

            }

        },
        removeTrashedElements : function () {

            for ( var i in this.trashedElements ) {
                this.trashedElements[i].destroy();
            }
            this.trashedElements = [];

        },
        removeEndScreen: function () {

            this.isEndScreen = false;
            this.endGraphic.destroy();
            this.endtext.destroy();

            for ( var i in this.endButs ) {
                this.endButs[i].destroy();
            }
            this.endButs = [];

        },
        removeFleet : function () {

            for ( var i in this.ship ) {
                this.ship[i].destroy();
            }
            this.ship = {};

            this.gameData['self'].fleet = [];
            this.gameData['oppo'].fleet = [];
            
        },
        removePrompt :  function () {

            this.readyGraphic.destroy();
            this.readyTxt.destroy();

            for ( var i in this.endButs ) {
                this.endButs[i].destroy();
            }
            this.endButs = [];

            this.isPrompted = false;
        },
        removeLegends : function () {

            for ( var i=0; i<this.legend.length; i++) {
                this.legend[i].destroy();
            }
            this.legend = [];

        },
        resetGrid : function () {

            for ( var i in this.gameData['self'].grid ) {
                this.gameData['self'].grid[i].isResided = false;
                this.gameData['self'].grid[i].isTrashed = false;
                this.gameData['self'].grid[i].index = -1;
            }
            for ( var j in this.gameData['oppo'].grid ) {
                this.gameData['oppo'].grid[j].isResided = false;
                this.gameData['oppo'].grid[j].isTrashed = false;
                this.gameData['oppo'].grid[j].index = -1;
            }

        },
        resetPlayerIndicators : function () {

            this.plyrIndicator['self'].reset();
            this.plyrIndicator['oppo'].reset();

            this.player['self'].resetData();
            this.player['oppo'].resetData();
            
        },
        resetGame: function () {
            
            if (this.view !== 'self' ) this.switchView ();

            if ( this.isEndScreen ) this.removeEndScreen();

            this.moveField (true);
            this.removeTrashedElements ();
            this.removeLegends();
            this.removeFleet ();
            this.resetGrid ();
            this.resetPlayerIndicators ();

            var _this = this;

            setTimeout ( function () {

                for ( var i=0; i< _this.cell.length; i++ ) {
                    _this.cell[i].setInteractive();
                }
                _this.createFleetData ();
                _this.createFleet();
                _this.createButtons ()

            }, 500 );

        },
        leaveGame :  function () {

            console.log ('leaving sceneB');

            socket.emit ('leaveGame');

            socket.removeAllListeners();

            this.bgmusic.stop();

            this.scene.start ('SceneA');

        }

    });

    //..Buttons...
    var MyButton =  new Phaser.Class({

        Extends: Phaser.GameObjects.Container,

        initialize:

        function MyButton ( scene, id, x, y, width, height, text, bgColor = 0x3a3a3a )
        {

            Phaser.GameObjects.Container.call(this, scene)

            this.setPosition(x, y).setSize(width, height).setInteractive();

            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.isActive = false;
            this.isClicked = false;
            this.bgColor = bgColor;
            
            this.shape = scene.add.graphics ( { fillStyle: { color: bgColor, alpha: 1 } } );
            this.shape.fillRoundedRect ( -width/2, -height/2, width, height, height * 0.1);

            var txtConfig = { 
                fontFamily: 'Trebuchet MS', 
                //fontStyle : 'bold',
                fontSize: Math.floor(height * 0.38), 
                color: '#fff' 
            };

            this.text = scene.add.text ( 0, 0, text, txtConfig ).setOrigin(0.5);

            //add to container...
            this.add ([this.shape, this.text]);


            scene.children.add ( this );
        },

        change : function ( clr ) {

            this.shape.clear();
            this.shape.fillStyle( clr, 1);
            this.shape.fillRoundedRect ( -this.width/2, -this.height/2, this.width, this.height, 5);

        },
    
        
    });

    //..Legends...
    var Legend =  new Phaser.Class({

        Extends: Phaser.GameObjects.Container,

        initialize:

        function Legend ( scene, id, x, y, width, height, player, type, len, rems )
        {
            Phaser.GameObjects.Container.call(this, scene)

            this.setPosition(x, y).setSize(width, height);

            this.id = id;
            this.x = x;
            this.y = y;
            this.type = type;
            this.len = len;
            this.player = player;
            this.rems = rems;

            this.shape = scene.add.graphics ( { fillStyle: { color: 0xffffcc,  alpha:0.8 }, lineStyle : { color: 0x9a9a9a, width:1 } });
            this.shape.fillRoundedRect ( -width/2, -height/2, width, height, 3 );
            this.shape.strokeRoundedRect ( -width/2, -height/2, width, height, 3 );

            var top = -height/2,
                left = -width/2;

            var txtConfig = { 
                fontFamily: 'Arial', 
                fontStyle: 'bold',
                fontSize: Math.floor(height * 0.3), 
                color: '#333' 
            };

            this.text = scene.add.text ( left + width*0.1, top + height*0.1, type, txtConfig ).setOrigin(0);

            var gS = width * 0.08,
                gSp = gS * 0.2,
                gX = left + width*0.1,
                gY = top + height*0.55;
                
            this.graphic = scene.add.graphics();
            this.graphic.fillStyle ( 0x8a8a8a, 1);
            for ( var i=0; i<len; i++) {
                this.graphic.fillRect ( gX + i * ( gS + gSp ), gY, gS, gS );
            }

            this.graphic.fillStyle ( player == 'self' ? 0x00cc00 : 0xff3333, 1);
            for ( var i=0; i<rems; i++) {
                this.graphic.fillRect ( gX + i * ( gS + gSp ), gY, gS, gS );
            }

            this.add ([this.shape, this.text, this.graphic]); // add elements to this container..

            scene.children.add ( this ); //add to scene...

        },

        updateRems : function ( rems ) {
        //..
            this.rems = this.rems += -1;

            var top = -this.height/2,
                    left = -this.width/2;

                var gS = this.width * 0.08,
                    gSp = gS * 0.2,
                    gX = left + this.width*0.1,
                    gY = top + this.height*0.55;

            this.graphic.clear();

            this.graphic.fillStyle ( 0x8a8a8a, 1);
                for ( var i=0; i< this.len ; i++) {
                    this.graphic.fillRect ( gX + i * ( gS + gSp ), gY, gS, gS );
                }

                this.graphic.fillStyle ( this.player == 'self' ? 0x00cc00 : 0xff3333, 1);
                for ( var i=0; i<this.rems; i++) {
                    this.graphic.fillRect ( gX + i * ( gS + gSp ), gY, gS, gS );
                }

            }

    });

    //..Grids...
    var Cell =  new Phaser.Class({

        Extends: Phaser.GameObjects.Container,

        initialize:

        function Cell ( scene, id, x, y, width, height, row, col, bgColor = 0x3c3c3c )
        {
            Phaser.GameObjects.Container.call(this, scene)

            this.setPosition(x, y).setSize(width, height).setInteractive();

            this.id = id;
            this.x = x;
            this.y = y;
            
            this.bgColor = 0x3c3c3c;

            this.bgColor2 = 0x4e4e4e;

            this.rect = scene.add.rectangle ( 0, 0, width, height, this.bgColor, 1 ).setStrokeStyle ( 1, 0xdedede, 0.9 );

            var txtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor(height * 0.23 ), 
                color: '#fff' 
            };

            var top = -height/2, left = -width/2;

            this.text = scene.add.text ( left + width * 0.1, top + height * 0.1, id, txtConfig );

           
            this.add ([this.rect, this.text]); // add elements to this container..

            scene.children.add ( this ); //add to scene...

        },

        change : function ( clr, alpha=1 ) {
            //
            this.rect.setFillStyle ( clr, alpha );

        }

    });

    //..Blocks...
    var Ship = new Phaser.Class({

        Extends: Phaser.GameObjects.Container,

        initialize:

        function Ship ( scene, id, x, y, width, height, size, rot, len, code, player, post, index, isHidden )
        {
            Phaser.GameObjects.Container.call(this, scene)

            this.setPosition(x, y).setSize( width, height).setVisible(isHidden);

            this.id = id;
            this.x = x;
            this.y = y;
            this.size = size;
            this.post = post;
            this.width = width;
            this.height = height;
            this.len = len;
            this.rems = len;
            this.rot = rot;
            this.player = player;
            this.code = code;
            this.bgColor = ( player == 'self' ? 0x66ff66 : 0xffcc66 );
            this.index = index;
            this.isHidden = !isHidden;

            this.rect = scene.add.rectangle ( 0,0, width, height );

            this.shape = scene.add.graphics ( { fillStyle: { color: this.bgColor ,  alpha: 0.7 }, lineStyle : { color: 0xcccccc, width:1 } });
            this.shape.fillRect ( -width/2, -height/2, width, height);
        
            var txtConfig = { 
                fontFamily: 'Verdana', 
                fontSize: Math.floor( size * 0.25), 
                fontStyle: 'bold',
                color: '#333' 
            };

            var rotation = ( rot == 0 ) ? 0 : Math.PI/180*90;

            var originY = ( rot == 1 ) ? 1 : 0;

            this.image = scene.add.image ( -width/2, -height/2, 'thumbs', this.index ).setScale ( size/80 ).setRotation ( rotation ).setOrigin(0, originY);

            this.text = scene.add.text ( 0, 0, code, txtConfig ).setOrigin(0.5).setRotation(rotation);

            this.add ([ this.rect, this.shape, this.image, this.text ]); // add elements to this container..

            this.setInteractive ( this.rect, Phaser.Geom.Rectangle.Contains );
            
            scene.children.add ( this ); //add to scene...
            
        },
        changeRotation :  function () {

            var rotation = ( this.rot == 0 ) ? 0 : Math.PI/180*90;

            var originY = ( this.rot == 1 ) ? 1 : 0;

            this.image.setPosition(-this.width/2, -this.height/2).setRotation ( rotation ).setOrigin ( 0, originY );

            this.text.setRotation(rotation);

            this.rect.setPosition(0,0).setSize( this.width, this.height );

        
        },
        changeBackground : function ( clr ) {

            this.shape.clear();
            this.shape.fillStyle( clr, 0.6);
            this.shape.fillRect ( -this.width/2, -this.height/2, this.width, this.height );

        },
        reset: function () {
            
            this.isActive = false;
            
            this.shape.clear();
            this.shape.fillStyle( this.bgColor, 0.6);
            this.shape.fillRect ( -this.width/2, -this.height/2, this.width, this.height );


        },


    });

    //..PlayerIndicator...
    var PlayerIndicator = new Phaser.Class({

        Extends: Phaser.GameObjects.Container,

        initialize:

        function PlayerIndicator ( scene, id, x, y, width, height, name, max )
        {
            Phaser.GameObjects.Container.call(this, scene)

            this.setPosition(x, y).setSize( width, height);

            this.id = id;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.winClr = ( id == 'self' ? 0x00cc00 :  0xff3333 );
            this.name = name;
            this.max = max;
            this.scene = scene;
            this.bgColor = 0xf3f3f3;

            this.shape = scene.add.graphics ( { fillStyle: { color: this.bgColor ,  alpha: 0.7 }, lineStyle : { color: 0xa4a4a4, width:1 } });
            this.shape.fillRoundedRect ( -width/2, -height/2, width, height, 3);
            this.shape.strokeRoundedRect ( -width/2, -height/2, width, height, 3);

            //players name...
            var top = -height/2, 
                left = -width/2;

            var txtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( height * 0.36 ), 
                fontStyle: 'bold',
                color: '#333' 
            };

            var winTxtConfig = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( height * 0.3 ), 
                //fontStyle: 'bold',
                color: '#ff6600' 
            };

            this.text = scene.add.text ( left + (width * 0.04), top + (height * 0.16), name, txtConfig ).setOrigin(0);

            this.winTxt = scene.add.text ( left + (width * 0.04), top + height * 0.53, '✪ Wins: 0', winTxtConfig ).setOrigin(0);

            var txtConfig2 = { 
                fontFamily: 'Trebuchet MS', 
                fontSize: Math.floor( height * 0.25 ), 
                fontStyle: 'bold',
                color: '#3c3c3c'
            };
    
            this.turnTxt = this.scene.add.text ( left + width*0.98, top + height * 0.4, '', txtConfig2 ).setOrigin(1);
    
            this.add ([ this.shape, this.text, this.winTxt, this.turnTxt ]); // add elements to this container..

            scene.children.add ( this ); //add to scene...
            
        },

        updateWins : function (wins) {

            this.winTxt.text = '✪ Wins: ' + wins;

        },
        reset : function () {

            this.turnTxt.text = '';

            this.shape.clear();
            this.shape.fillStyle( this.bgColor, 0.7 );
            this.shape.fillRoundedRect ( -this.width/2, -this.height/2, this.width, this.height, 3);
            this.shape.strokeRoundedRect ( -this.width/2, -this.height/2, this.width, this.height, 3);

        },
        isTurn: function ( turn=true ) {

            this.turnTxt.text = (turn == true) ? '· Your Turn ·' : '';

            this.shape.clear();
            this.shape.fillStyle( !turn ? 0xf3f3f3 : 0xffff99, 0.7 );
            this.shape.fillRoundedRect ( -this.width/2, -this.height/2, this.width, this.height, 3);
            this.shape.strokeRoundedRect ( -this.width/2, -this.height/2, this.width, this.height, 3);

        }


    });

    //..Player...
    var Player = new Phaser.Class({

        initialize:

        function Player ( id, name, isAi )
        {
            this.id = id;
            this.name = name;
            this.isAi = isAi;
            this.wins = 0;
            this.pickOrigin = -1,
            this.lastGoodPick = -1,
            this.pickDirection = '';

        },
        resetData : function () {

            this.pickOrigin = -1,
            this.lastGoodPick = -1,
            this.pickDirection = '';
        }

    });

    //..Grid...
    var MyGrid = new Phaser.Class({

        initialize:

        function MyGrid ( x, y, row, col, cnt  )
        {
            this.x = x;
            this.y = y;
            this.col = col;
            this.row = row;
            this.cnt = cnt;
            this.index = -1;
            this.isResided = false;
            this.isTrashed = false;
        }

    });


   

} 

    
    /* FBInstant.getLeaderboardAsync("global_leaderboard")
        .then(leaderboard => leaderboard.getEntriesAsync(3, 0))
            .then(entries => {
            console.log("TOP SCORES")
            for (var i = 0; i < entries.length; i++) {
                console.log("#" + entries[i].getRank() + " " + entries[i].getPlayer().getName() + ": " + entries[i].getScore());
            }
        }).catch(error => console.error(error)); */
        
    
/*

FBInstant.initializeAsync().then(function() {        
    
    // Start loading game assets here
    FBInstant.setLoadingProgress(100);

    FBInstant.player.getDataAsync(["best"]).then(function(data){
        if(typeof data["best"] !== "undefined"){
            console.log ( data['best'] );
            savedData.best = data['best'].toString();
        }
    });

    FBInstant.startGameAsync().then(function() {

        facebookStuff.name = FBInstant.player.getName();
        facebookStuff.picture = FBInstant.player.getPhoto();

        parentDiv = document.getElementById('game_div');
    
        config = {

            type: Phaser.AUTO,
            width: parentDiv.clientWidth,
            height: parentDiv.clientHeight,
            backgroundColor: '#333',
            audio: {
                disableWebAudio: true
            },
            parent:'game_div',
            scene: [ SceneA, SceneB, EndFrame ]

        };

        game = new Phaser.Game(config);

        // Retrieving context and player information can only be done
        // once startGameAsync() resolves
        var contextId = FBInstant.context.getID();
        var contextType = FBInstant.context.getType();

        var playerName = FBInstant.player.getName();
        var playerPic = FBInstant.player.getPhoto();
        var playerId = FBInstant.player.getID();

        // Once startGameAsync() resolves it also means the loading view has 
        // been removed and the user can see the game viewport


    });
                

});
    
*/





