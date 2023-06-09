//棋盘消子
function calcBoard(arr,i,j){
	let player = arr[i][j];
	
	let prompts = [];
	
	let vectorRow = getArrayRow(arr, i);
	let vectorCol = getArrayColumn(arr, j);
	
	let resultX,resultY;
	
	resultX = calcVec(vectorRow, player);
	resultY = calcVec(vectorCol, player);
	
	setArrayRow(arr, resultX.vec, i);
	setArrayColumn(arr, resultY.vec, j);
	
	prompts.push(resultX.prompt);
	prompts.push(resultY.prompt);
	
	return {arr, prompts};
	
}

//向量消子
function calcVec(vec, player) {
  //有效棋子个数
  let chessNumber = getChessNumber(vec);
  //执手方棋子个数
  let playerChessNumber = getPlayerChessNumber(vec,player);
  //吃子提示
  let prompt = null;

  if (chessNumber === 3 && vec.indexOf(0)%3 === 0) { // 有效子数>3且0在头或尾，需评估是否可以消子
    //判断执手方棋子数
    if (playerChessNumber === 1) {
      /** 判断有无一撑乎，头或尾为0且执手子落在对手子中间 **/
      if ((vec.indexOf(0)-vec.indexOf(player))%2===0) {
        prompt = "一撑乎";
        vec = removeOtherPlayer(vec, player);
      }
    } else if (playerChessNumber === 2) {
      /**判断有无二顶一或一夹沟，执手子相邻为二顶一，不相邻为一夹沟**/
        prompt = vec[vec.indexOf(player)+1]===player?"二顶一":"一夹沟";
        vec = removeOtherPlayer(vec, player);
    }
  } else if (chessNumber === 4) {
    if (playerChessNumber === 2) { //两夹沟、两撑乎、二顶二
      if (vec[0] === player && vec[3] === player) {//两夹沟
        prompt = "两夹沟";
        vec = removeOtherPlayer(vec, player);
      } else if (vec[0] === vec[3] && vec[0] != player) {//两撑乎
        prompt = "两撑乎";
        vec = removeOtherPlayer(vec, player);
      } else if (vec[0] != vec[3] && vec[0] === vec[1]) {//二顶二
        prompt = "二顶二";
        vec = removeOtherPlayer(vec, player);
      }
    } else if (playerChessNumber === 1) {//一串三
      if (vec[0] === player || vec[3] === player) {
        prompt = "一串三";
        vec = removeOtherPlayer(vec, player);
      }
    }
  }
  return {vec, prompt};
}

//消子方法
function removeOtherPlayer(vec, player) {
  for (let i = 0; i < 4; i++) {
    if (vec[i] != player) {
      vec[i] = 0;
    }
  }
  return vec;
}

//检查是否已出现赢方、和棋
function checkWin(arr,player,i,j){
    let status = {'isGameEnd':false,'winner':null}
    let board = sumChess(arr);
	let rowVec = getArrayRow(arr,i);
	let colVec = getArrayColumn(arr,j);
	let sumRowVec = rowVec[0]+rowVec[1]+rowVec[2]+rowVec[3];
	let sumColVec = colVec[0]+colVec[1]+colVec[2]+colVec[3];
	//三元表达式判断是否出现一条吕
	status.isGameEnd = Math.abs(sumRowVec) === 4 || Math.abs(sumColVec) === 4;
    if(status.isGameEnd){
        status.winner = player;
	}else if(board.former + board.later === 16){
        status.isGameEnd = true;
        status.winner = (board.former > board.later ? 1 : (board.former < board.later ? -1 : null));
    }
    return status;
}

//计数红蓝子个数
function sumChess(arr){
    let redChess = 0;
    let cyanChess = 0;
    for(row in arr){
        for(col in arr[row]){
            if(arr[row][col] === 1)
                redChess++;
            else if(arr[row][col] === -1)
                cyanChess++;
        }
    }
    return {'former':redChess,'later':cyanChess};
}

function getArrayRow(arr, row) {
  return arr[row];
}

function setArrayRow(arr, vec, row) {
  arr[row] = vec;
}

function getArrayColumn(arr, col) {
  var vec = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    vec[i] = arr[i][col];
  }
  return vec;
}

function setArrayColumn(arr, vec, col) {
  for (let i = 0; i < 4; i++) {
    arr[i][col] = vec[i];
  }
}

//执手方棋子个数
function getPlayerChessNumber(vec,player){
  var playerChessNumber = 0;
  for (let i = 0; i < 4; i++) {
    if (vec[i] == player) {
      playerChessNumber++;
    }
  }
  return playerChessNumber;
}

//所有棋子个数
function getChessNumber(vec){
  var chessNumber = 0;
  for(let i = 0;i<4;i++){
    if(vec[i]!=0)
      chessNumber++;
  }
  return chessNumber;
}


