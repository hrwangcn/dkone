class Player {
    static get BLACK() { return 1; }
    static get EMPTY() { return 0; }
    static get WHITE() { return -1; }

    constructor(type, isAI) {
        this.type = type;
        this.isAI = isAI;
        this.isMyTurn = false;
    }

    getAction(game, option) {
        if (this.isAI) {
            // 使用 Alpha-Beta 剪枝优化 Minimax 算法，搜索深度设置为 6
            let bestMove = this.alphaBeta(game, 6, -Infinity, Infinity, true).move;
            return new Action({ target: bestMove });
        }
        if (game.status === Game.RUN) {
            if (game.board.getCell(option.target) === 0) {
                return new Action(option);
            } else {
                throw new Error('Bad target');
            }
        } else {
            throw new Error('Not start');
        }
    }

    alphaBeta(game, depth, alpha, beta, isMaximizing) {
        if (game.status === Game.WIN || game.status === Game.TIE || depth === 0) {
            return { score: this.evaluate(game), move: null };
        }

        let bestMove = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (let i = 0; i < game.board.getSize() * game.board.getSize(); i++) {
            if (game.board.getCell(i) === Player.EMPTY) {
                let clonedGame = game.clone();
                let action = new Action({ target: i });
                clonedGame.excute(action);
                let result = this.alphaBeta(clonedGame, depth - 1, alpha, beta, !isMaximizing);

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

                if (beta <= alpha) {
                    break;
                }
            }
        }

        return { score: bestScore, move: bestMove };
    }

    evaluate(game) {
        let score = 0;
        for (let i = 0; i < game.board.getSize(); i++) {
            let row = game.board.getRow(i);
            let col = game.board.getColumn(i);
            score += this.evaluateLine(row);
            score += this.evaluateLine(col);
        }
        return score;
    }

    evaluateLine(line) {
        let score = 0;
        let playerCount = line.filter(cell => cell === this.type).length;
        let opponentCount = line.filter(cell => cell === -this.type).length;

        if (playerCount === 4) {
            score += 100;
        } else if (opponentCount === 4) {
            score -= 100;
        } else if (playerCount === 3 && opponentCount === 0) {
            score += 50;
        } else if (opponentCount === 3 && playerCount === 0) {
            score -= 50;
        } else if (playerCount === 2 && opponentCount === 0) {
            score += 10;
        } else if (opponentCount === 2 && playerCount === 0) {
            score -= 10;
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
    static get RUN() { return 1; }
    static get WIN() { return 2; }
    static get TIE() { return 3; }

    // 定义 cases 为静态成员
    static get cases() {
        return {
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
    }

    constructor(player1, player2) {
        this.players = [player1, player2];
        this.winner = null;
        this.items = [];
        this.history = [];
        this.board = new Board(); // 使用 Board 类
    }

    start() {
        this.status = Game.RUN;
        this.players[0].isMyTurn = true;
        this.players[1].isMyTurn = false;
        this.board = new Board(); // 重置棋盘
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

    updateBoard(target) {
        let row = this.board.getRow(Math.floor(target / this.board.getSize()));
        let col = this.board.getColumn(target % this.board.getSize());
        let rowString = this.getCharacterString(row);
        let colString = this.getCharacterString(col);
        let playerType = this.getCurrentPlayer().type;

        if (Game.cases[rowString]) {
            this.board.setRow(row.map(item => {
                return item === playerType ? item : 0;
            }), Math.floor(target / this.board.getSize()));
            this.items.push(Game.cases[rowString]);
        }
        if (Game.cases[colString]) {
            this.board.setColumn(col.map(item => {
                return item === playerType ? item : 0;
            }), target % this.board.getSize());
            this.items.push(Game.cases[colString]);
        }
    }

    excute(action) {
        this.items = [];
        this.history.push(JSON.stringify(this.board.grid));
        this.board.setCell(action.target, this.getCurrentPlayer().type);
        this.updateBoard(action.target);
        this.winner = this.findWinner(action.target);
        if (this.winner) {
            this.status = Game.WIN;
        } else {
            if (this.board.isFull()) {
                this.status = Game.TIE;
            } else {
                this.changeCurrentPlayer();
            }
        }
    }

    retract() {
        if (this.history.length !== 0 && this.status === Game.RUN) {
            this.board.grid = JSON.parse(this.history.pop());
            this.changeCurrentPlayer();
            return true;
        }
        return false;
    }

    findWinner(target) {
        let colString = this.getCharacterString(this.board.getColumn(target % this.board.getSize()));
        let rowString = this.getCharacterString(this.board.getRow(Math.floor(target / this.board.getSize())));
        if (colString === 'aaaa' || rowString === 'aaaa') {
            return this.getCurrentPlayer();
        } else if (this.board.isFull()) {
            let sumBoard = this.board.grid.reduce((sum, item) => sum + item);
            if (sumBoard > 0) {
                return this.getPlayerByType(Player.BLACK);
            }
            if (sumBoard < 0) {
                return this.getPlayerByType(Player.WHITE);
            }
        }
    }

    // 深层克隆方法
    clone() {
        let clonedGame = new Game(this.players[0], this.players[1]);
        clonedGame.status = this.status;
        clonedGame.winner = this.winner;
        clonedGame.items = [...this.items];
        clonedGame.history = [...this.history];
        clonedGame.board = this.board.clone(); // 克隆棋盘
        clonedGame.players = this.players.map(player => {
            let clonedPlayer = new Player(player.type, player.isAI);
            clonedPlayer.isMyTurn = player.isMyTurn;
            return clonedPlayer;
        });
        return clonedGame;
    }
}

class Board {
    constructor(size = 4) {
        this.size = size;
        this.grid = new Array(size * size).fill(0); // 初始化棋盘
    }

    // 获取棋盘大小
    getSize() {
        return this.size;
    }

    // 获取某一行的数据
    getRow(rowIndex) {
        let row = [];
        for (let j = 0; j < this.size; j++) {
            row.push(this.grid[rowIndex * this.size + j]);
        }
        return row;
    }

    // 获取某一列的数据
    getColumn(colIndex) {
        let col = [];
        for (let i = 0; i < this.size; i++) {
            col.push(this.grid[i * this.size + colIndex]);
        }
        return col;
    }

    // 设置某一行的数据
    setRow(row, rowIndex) {
        for (let j = 0; j < this.size; j++) {
            this.grid[rowIndex * this.size + j] = row[j];
        }
    }

    // 设置某一列的数据
    setColumn(col, colIndex) {
        for (let i = 0; i < this.size; i++) {
            this.grid[i * this.size + colIndex] = col[i];
        }
    }

    // 获取某个位置的值
    getCell(index) {
        return this.grid[index];
    }

    // 设置某个位置的值
    setCell(index, value) {
        this.grid[index] = value;
    }

    // 克隆棋盘
    clone() {
        let clonedBoard = new Board(this.size);
        clonedBoard.grid = [...this.grid];
        return clonedBoard;
    }

    // 检查棋盘是否已满
    isFull() {
        return this.grid.every(cell => cell !== 0);
    }
}