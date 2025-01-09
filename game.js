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
        //评估行列
        for (let i = 0; i < game.board.getSize(); i++) {
            let row = new Line(game.board.getRow(i));
            let col = new Line(game.board.getColumn(i));
            score += this.evaluateLine(row);
            score += this.evaluateLine(col);
        }
        //让AI理解子多可赢
        if (game.board.isFull()) {
            let playerCount = game.board.countByType(this.type);
            let opponentCount = game.board.countByType(-this.type);
            if (playerCount > opponentCount) {
                score += 1000;
            } else if (playerCount < opponentCount) {
                score -= 1000;
            }
        }
        return score;
    }

    evaluateLine(line) {
        let lineString = line.getCharacterString(this.type);
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

    hasSituation(pattern) {
        if (pattern.length !== this.board.grid.length) {
            throw new Error('Pattern length must be equal to board size');
        } else {
            let kernel = [];
            for (let i = 0; i < pattern.length; i++) {
                switch (pattern[i]) {
                    case 'a':
                        kernel.push(this.getCurrentPlayer().type);
                        break;
                    case 'b':
                        kernel.push(-this.getCurrentPlayer().type);
                        break;
                    case 'o':
                        kernel.push(0);
                        break;
                    case 'c':
                        kernel.push(-2);
                        break;
                }
            }
            return this.board.hasStruct(kernel);
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

    //统计某一类型棋子个数
    countByType(playerType) {
        return this.grid.filter(cell => cell === this.type).length;
    }

    // 检查是否存在某种结构
    hasStruct(kernel) {
        if (kernel.length !== this.size * this.size) {
            throw new Error('Invalid kernel length');
        } else {
            let result = true;
            for (let i = 0; i < this.size * this.size; i++) {
                if (kernel[i] !== -2) {
                    result = result && kernel[i] === this.getCell(i);
                }
            }
            return result;
        }
    }
}

class BoardUtil {
    static rotate90(arr) {
        let result = [];
        let n = Math.sqrt(arr.length);
        for (let j = 0; j < n; j++) {
            result = result.concat(arr.filter((item, index) => index % n === j).reverse());
        }
        return result;
    }

    static rotate180(arr) {
        return BoardUtil.rotate90(BoardUtil.rotate90(arr));
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
            result = result.concat(BoardUtil.rotate180(arr).slice(i * n, i * n + n));
        }
        return result;
    }

    static verticalFlip(arr) {
        return BoardUtil.rotate180(BoardUtil.horoizontalFlip(arr));
    }

    static leftDiagFlip(arr) {
        return BoardUtil.rotate270(BoardUtil.horoizontalFlip(arr));
    }

    static rightDiagFlip(arr) {
        return BoardUtil.rotate90(BoardUtil.horoizontalFlip(arr));
    }
}

class Line {
    constructor(array) {
        this.array = array;
    }

    countByType(playerType) {
        return this.array.filter(cell => cell === playerType).length;
    }

    getCharacterString(playerType) {
        let result = '';
        for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] === playerType) {
                result += 'a';
            } else if (this.array[i] === -playerType) {
                result += 'b';
            } else {
                result += 'o';
            }
        }
        return result;
    }

    reverse() {
        return new Line(this.array.reverse());
    }
}