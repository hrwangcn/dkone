class Player {
    static get BLACK() { return 1 };
    static get EMPTY() { return 0 };
    static get WHITE() { return -1 };
    constructor(type,isAI) {
        this.type = type;
        this.isAI = isAI;
        this.isMyTurn = false;
    }
    getAction(game,option) {
        if(this.isAI){
            //进行MCTS并返回Action
        }
        if (game.status === Game.RUN) {
            if (game.board[option.target] === 0) {
                return new Action(option);
            } else {
                throw new Error('Bad target');
            }
        } else {
            throw new Error('Not start');
        }
    }
}

class Action {
    constructor(option) {
        this.target = option.target;
    }
}

class Game {

    static get RUN() { return 1 }
    static get WIN() { return 2 }
    static get TIE() { return 3 }
    constructor(player1, player2) {
        this.players = [player1, player2];
        this.winner = null;
        this.items = [];
        this.cases = {
            'aabo': '二顶一',
            'obaa': '二顶一',
            'oaab': '二顶一',
            'baao': '二顶一',
            'aabb': '二顶二',
            'bbaa': '二顶二',
            'abbb': '一串三',
            'bbba': '一串三',
            'abba': '两夹沟',
            'baab': '两撑乎',
            'abao': '一夹沟',
            'oaba': '一夹沟',
            'babo': '一撑乎',
            'obab': '一撑乎',
        };
        this.history = [];
    }

    start() {
        this.status = Game.RUN;
        this.players[0].isMyTurn = true;
        this.players[1].isMyTurn = false;
        this.board = new Array(16).fill(0);
        return this;
    }

    getPlayerByType(type) {
        return this.players.find(player => player.type === type);
    }

    getCurrentPlayer() {
        return this.players.find(player => player.isMyTurn);
    }

    changeCurrentPlayer() {
        this.players.forEach(player => player.isMyTurn = !player.isMyTurn);
    }

    getColumn(target) {
        return this.board.filter((item, index) => index % 4 === target % 4);
    }

    setColumn(array, target) {
        let j = target % 4;
        for (let i = 0; i < array.length; i++) {
            this.board[i * 4 + j] = array[i];
        }
    }

    getRow(target) {
        return this.board.filter((item, index) => (index / 4 | 0) === (target / 4 | 0));
    }

    setRow(array, target) {
        let i = target / 4 | 0;
        for (let j = 0; j < array.length; j++) {
            this.board[i * 4 + j] = array[j];
        }
    }

    getCharacterString(array) {
        let string = '';
        let type = this.getCurrentPlayer().type;
        for (let i = 0; i < array.length; i++) {
            switch (array[i]) {
                case type:
                    string += 'a';
                    break;
                case -type:
                    string += 'b';
                    break;
                case 0:
                    string += 'o';
                    break;
            }
        }
        return string;
    }

    isFull(board) {
        return board.every(item => item !== 0);
    }

    updateBoard(target) {
        let row = this.getRow(target);
        let col = this.getColumn(target);
        let rowString = this.getCharacterString(row);
        let colString = this.getCharacterString(col);
        let playerType = this.getCurrentPlayer().type;
        if (this.cases[rowString]) {
            this.setRow(row.map(item => {
                return item === playerType ? item : 0;
            }), target);
            this.items.push(this.cases[rowString]);
        }
        if (this.cases[colString]) {
            this.setColumn(col.map(item => {
                return item === playerType ? item : 0;
            }), target);
            this.items.push(this.cases[colString]);
        }
    }

    excute(action) {
        this.items = [];
        this.history.push(JSON.stringify(this.board));
        this.board[action.target] = this.getCurrentPlayer().type;
        //吃子
        this.updateBoard(action.target);
        //找赢家
        this.winner = this.findWinner(action.target);
        if (this.winner) {
            this.status = Game.WIN;
        } else {
            //棋盘下满，和棋
            if (this.isFull(this.board)) {
                this.status = Game.TIE;
            } else { //棋盘没满，换手
                this.changeCurrentPlayer();
            }
        }
    }

    retract() {
        if(this.history.length != 0  && this.status === Game.RUN){
            this.board = JSON.parse(this.history.pop());
            this.changeCurrentPlayer();
            return true;
        }
        return false;
    }

    findWinner(target) {
        let colString = this.getCharacterString(this.getColumn(target));
        let rowString = this.getCharacterString(this.getRow(target));
        //落子形成一条驴落子赢
        if (colString === 'aaaa' || rowString === 'aaaa') {
            return this.getCurrentPlayer();
            //都没有一条驴且棋盘下满的情况下棋子多的赢
        } else if (this.isFull(this.board)) {
            let sumBoard = this.board.reduce((sum, item) => sum + item);
            if (sumBoard > 0) { //黑子多，黑赢
                return this.getPlayerByType(Player.BLACK);
            }
            if (sumBoard < 0) { //白子多，白赢
                return this.getPlayerByType(Player.WHITE);
            }
        }
    }
}