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
        //让AI理解子多可赢
        if (game.board.isFull()) {
            let playerCount = Util.countByType(game.board.grid, this.type);
            let opponentCount = Util.countByType(game.board.grid, -this.type);
            if (playerCount > opponentCount) {
                score += 1000;
            } else if (playerCount < opponentCount) {
                score -= 1000;
            }
        }
        //评估行列
        for (let i = 0; i < game.board.getSize(); i++) {
            let row = game.board.getRow(i);
            let col = game.board.getColumn(i);
            score += this.evaluateLine(row);
            score += this.evaluateLine(col);
        }
        return score;
    }

    evaluateLine(line) {
        let lineString = Util.getCharacterString(line, this.type);
        return VALUETABLE[lineString] || 0;
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

    constructor(player1, player2) {
        this.players = [player1, player2];
        this.winner = null;
        this.items = [];
        this.history = [];
        this.historyStep = [];
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

    updateBoard(target) {
        let row = this.board.getRow(Math.floor(target / this.board.getSize()));
        let col = this.board.getColumn(target % this.board.getSize());
        let playerType = this.getCurrentPlayer().type;
        let rowString = Util.getCharacterString(row, playerType);
        let colString = Util.getCharacterString(col, playerType);

        if (CASES[rowString]) {
            this.board.setRow(row.map(item => {
                return item === playerType ? item : 0;
            }), Math.floor(target / this.board.getSize()));
            this.items.push(CASES[rowString]);
        }
        if (CASES[colString]) {
            this.board.setColumn(col.map(item => {
                return item === playerType ? item : 0;
            }), target % this.board.getSize());
            this.items.push(CASES[colString]);
        }
    }

    excute(action) {
        this.items = [];
        this.historyStep.push(action.target);
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
        let type = this.getCurrentPlayer().type;
        let colString = Util.getCharacterString(this.board.getColumn(target % this.board.getSize()), type);
        let rowString = Util.getCharacterString(this.board.getRow(Math.floor(target / this.board.getSize())), type);
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
        clonedGame.historyStep = [...this.historyStep];
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

    // 获取当前board所有的对称性数组
    getAllSymmetries() {
        let symmetries = [];
        symmetries.push(this.grid);
        symmetries.push(Util.rotate90(this.grid));
        symmetries.push(Util.rotate180(this.grid));
        symmetries.push(Util.rotate270(this.grid));
        symmetries.push(Util.horoizontalFlip(this.grid));
        symmetries.push(Util.verticalFlip(this.grid));
        symmetries.push(Util.leftDiagFlip(this.grid));
        symmetries.push(Util.rightDiagFlip(this.grid));
        return symmetries;
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

    // 检查是否存在某种结构
    hasStruct(pattern, type) {
        let symmString = new Set(this.getAllSymmetries().map(symm => {
            return Util.getCharacterString(symm, type);
        }));
        return true && symmString.keys().find(str => Util.compareCharacterString(str, pattern));
    }
}

class Util {
    static rotate90(arr) {
        let result = [];
        let n = Math.sqrt(arr.length);
        for (let j = 0; j < n; j++) {
            result = result.concat(arr.filter((item, index) => index % n === j).reverse());
        }
        return result;
    }

    static rotate180(arr) {
        return Util.rotate90(Util.rotate90(arr));
    }

    static rotate270(arr) {
        let result = [];
        let n = Math.sqrt(arr.length);
        for (let j = n - 1; j > -1; j--) {
            result = result.concat(arr.filter((item, index) => index % n === j));
        }
        return result;
    }

    static horoizontalFlip(arr) {
        let result = [];
        let n = Math.sqrt(arr.length);
        for (let i = n - 1; i > -1; i--) {
            result = result.concat(Util.rotate180(arr).slice(i * n, i * n + n));
        }
        return result;
    }

    static verticalFlip(arr) {
        return Util.rotate180(Util.horoizontalFlip(arr));
    }

    static leftDiagFlip(arr) {
        return Util.rotate270(Util.horoizontalFlip(arr));
    }

    static rightDiagFlip(arr) {
        return Util.rotate90(Util.horoizontalFlip(arr));
    }

    static getCharacterString(array, type) {
        let result = '';
        for (let i = 0; i < array.length; i++) {
            if (array[i] === type) {
                result += 'a';
            } else if (array[i] === -type) {
                result += 'b';
            } else {
                result += 'o';
            }
        }
        return result;
    }

    static compareCharacterString(str, pattern) {
        if (str.length !== pattern.length) {
            return false;
        }
        for (let i = 0; i < pattern.length; i++) {
            if (str[i] !== pattern[i] && pattern[i] !== 'c') {
                return false;
            }
        }
        return true;
    }

    static countByType(array, type) {
        return array.filter(cell => cell === type).length;
    }
}

class Line {
    constructor(array) {
        this.array = array;
    }

    reverse() {
        return new Line(this.array.reverse());
    }
}