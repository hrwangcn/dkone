class Player {
    static get BLACK() { return 1 };
    static get EMPTY() { return 0 };
    static get WHITE() { return -1 };
    constructor(type,isAI) {
        this.type = type;
        this.isAI = isAI;
        this.isMyTurn = false;
    }
    getAction(game, option) {
        if (this.isAI) {
            // 使用 Alpha-Beta 剪枝优化 Minimax 算法
            let bestMove = this.alphaBeta(game, 6, -Infinity, Infinity, true).move;
            return new Action({ target: bestMove });
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

    alphaBeta(game, depth, alpha, beta, isMaximizing) {
        // 检查游戏是否结束或达到最大深度
        if (game.status === Game.WIN || game.status === Game.TIE || depth === 0) {
						//game.retract();
						//console.log('Found root!');
						console.log();
            return { score: this.evaluate(game), move: null };
        }

        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        // 遍历所有可能的落子位置
        for (let i = 0; i < game.board.length; i++) {
            if (game.board[i] === Player.EMPTY) {
                // 克隆 game 对象
                let clonedGame = game.clone();
                // 在克隆对象上模拟落子
                let action = new Action({ target: i });
                clonedGame.excute(action);
                let result = this.alphaBeta(clonedGame, depth - 1, alpha, beta, !isMaximizing);
                //clonedGame.retract();

                // 更新最佳分数和落子位置
                if (isMaximizing) {
                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestMove = i;
                    }
                    alpha = Math.max(alpha, bestScore);
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestMove = i;
                    }
                    beta = Math.min(beta, bestScore);
                }

                // Alpha-Beta 剪枝
                if (beta <= alpha) {
                    break;
                }
            }
        }

        return { score: bestScore, move: bestMove };
    }

    evaluate(game) {
        // 评估函数：根据当前棋盘状态计算分数
        let score = 0;

        // 检查行和列是否有潜在的优势
        for (let i = 0; i < 4; i++) {
            let row = game.getRow(i * 4);
            let col = game.getColumn(i);
            score += this.evaluateLine(row);
            score += this.evaluateLine(col);
        }

        return score;
    }

    evaluateLine(line) {
        // 评估一行或一列的分数
        let score = 0;
        let playerCount = line.filter(cell => cell === this.type).length;
        let opponentCount = line.filter(cell => cell === -this.type).length;

        if (playerCount === 4) {
            score += 100; // 玩家获胜
        } else if (opponentCount === 4) {
            score -= 100; // 对手获胜
        } else if (playerCount === 3 && opponentCount === 0) {
            score += 50; // 玩家有潜在获胜机会
        } else if (opponentCount === 3 && playerCount === 0) {
            score -= 50; // 对手有潜在获胜机会
        } else if (playerCount === 2 && opponentCount === 0) {
            score += 10; // 玩家有潜在优势
        } else if (opponentCount === 2 && playerCount === 0) {
            score -= 10; // 对手有潜在优势
        }

        return score;
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

		//深层拷贝对象
    clone() {
        let clonedGame = new Game(this.players[0], this.players[1]);
        clonedGame.status = this.status;
        clonedGame.winner = this.winner;
        clonedGame.board = [...this.board]; // 克隆棋盘
        clonedGame.items = [...this.items]; // 克隆消子记录
        clonedGame.history = [...this.history]; // 克隆历史记录

        // 深拷贝 players 数组
        clonedGame.players = this.players.map(player => {
            let clonedPlayer = new Player(player.type, player.isAI);
            clonedPlayer.isMyTurn = player.isMyTurn;
            return clonedPlayer;
        });

        return clonedGame;
    }
}