function calcBoard(vec, player) {
  //有效棋子个数
  var chessNumber = 0;
  //执手方棋子个数
  var playerChessNumber = 0;
  for (let i = 0; i < 4; i++) {
    if (vec[i] == player) {
      //计数执手方棋子数
      playerChessNumber++;
    }
    if (vec[i] != 0) {
      //计数有效元素个数
      chessNumber++;
    }
  }
  console.log(chessNumber);
  console.log(playerChessNumber);
  if (chessNumber < 3) { //有效棋子<3，不发生消子
    //return vec;
  } else if (chessNumber === 3 && vec.indexOf(0)%3 === 0) { // 有效子数>3且0在头或尾，需评估是否可以消子
    //判断执手方棋子数
    if (playerChessNumber === 1) {
      /** 判断有无一撑乎，头或尾为0且执手子落在对手子中间 **/
      if ((vec.indexOf(0)-vec.indexOf(player))%2===0) {
        console.log("一撑乎");
        vec = removeOtherPlayer(vec, player);
      }
    } else if (playerChessNumber === 2) {
      /**判断有无二顶一或一夹沟，执手子相邻为二顶一，不相邻为一夹沟**/
        console.log(vec[vec.indexOf(player)+1]===player?"二顶一":"一夹沟");
        vec = removeOtherPlayer(vec, player);
    } else { //3个都是执手子，不再调用资源计算
      //return vec;
    }
  } else if (chessNumber === 4) {
    if (playerChessNumber === 4) { //一条吕
      alert(player===1?"红方赢了!":"绿方赢了");
    } else if (playerChessNumber === 3) {
      //return vec;
    } else if (playerChessNumber === 2) { //两颊沟、两撑乎、二顶二
      if (vec[0] === player && vec[3] === player) {//两颊沟
        console.log("两颊沟");
        vec = removeOtherPlayer(vec, player);
      } else if (vec[0] === vec[3] && vec[0] != player) {//两撑乎
        console.log("两撑乎");
        vec = removeOtherPlayer(vec, player);
      } else if (vec[0] != vec[3] && vec[0] === vec[1]) {//二顶二
        console.log("二顶二");
        vec = removeOtherPlayer(vec, player);
      }
    } else if (playerChessNumber === 1) {//一串三
      if (vec[0] === player || vec[3] === player) {
        console.log("一串三");
        vec = removeOtherPlayer(vec, player);
      }
    } else {
      //return vec;
    }
  } else {
    //return vec;
  }
  return vec;
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