const Application = PIXI.Application,
  loader = PIXI.Loader.shared,
  resources = PIXI.Loader.shared.resources,
  Sprite = PIXI.Sprite,
  Container = PIXI.Container,
  TilingSprite = PIXI.TilingSprite,
  AnimatedSprite = PIXI.AnimatedSprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle,
  sound = PIXI.sound,
  Graphics = PIXI.Graphics;

const app = new Application({
  width: 512,
  height: 512,
  antialias: true,
  transparent: false,
  resolution: 1,
});

document.querySelector(".canvas-wrapper").appendChild(app.view);
loader.add("images/flappyBird/flappyBird.json").load(setup);

sound.add({
  point: "sounds/point.ogg",
  die: "sounds/die.ogg",
  hit: "sounds/hit.ogg",
  wing: "sounds/wing.ogg",
});

sound.volumeAll = 0.5;

const {
  barrierVelocity,
  distanceBetweenBarrier,
  numberOfBarriers,
  birdFlyVelocity,
  birdDescendVelocity,
  birdFallVelocity,
  baseVelocity,
  barriersGapHeight,
  storageKey,
} = gameSettings;

const { fontFamily, fontWeight, textCl, darkTextCl, strokePrimaryCl, strokeSecondaryCl } =
  globalTextStyle;
const { backgroundBtnCl, strokeBtnCl } = globalButtonStyle;

let gameState,
  id,
  mainScene,
  background,
  base,
  topBarrier,
  bottomBarrier,
  barriers = [],
  bird,
  birdXPos,
  birdYPos,
  direction = 1,
  soundContainer,
  soundOn,
  soundOff,
  isStarted = false,
  counter = 0,
  score,
  startGameMessage,
  isSoundPlayed = false,
  gameOverScene,
  gameOverBackground,
  gameOverMessage,
  resultMessage,
  restartButton,
  bestScoreContainer,
  bestScore,
  isClicked = 0,
  tickCount = 0,
  accelerationDown = 0,
  accelerationUp = 1.5;

const screenHeight = app.view.height;
const screenWidth = app.view.width;

function setup() {
  id = resources["images/flappyBird/flappyBird.json"].textures;

  mainScene = new Container();
  mainScene.interactive = true;
  app.stage.addChild(mainScene);

  background = new Sprite(id["background-day.png"]);
  background.scale.x = screenWidth / background.width;
  mainScene.addChild(background);

  for (let i = 0; i < numberOfBarriers; i++) {
    topBarrier = new Sprite(id["pipe-green.png"]);
    bottomBarrier = new Sprite(id["pipe-green.png"]);

    const barrier = generateBarrier(topBarrier, bottomBarrier);
    barrier.x = screenWidth + distanceBetweenBarrier * (i + 1);

    barriers.push(barrier);
    mainScene.addChild(barrier);
  }

  const birdTextures = [
    id["yellowbird-midflap.png"],
    id["yellowbird-downflap.png"],
    id["yellowbird-upflap.png"],
  ];
  bird = new AnimatedSprite(birdTextures);

  // Bird start position
  birdXPos = centerXSprite(app.view, bird);
  birdYPos = screenHeight / 2;
  bird.x = birdXPos;
  bird.y = birdYPos;
  bird.vy = 0;
  bird.vx = 0;
  bird.animationSpeed = 0.1;
  bird.play();
  mainScene.addChild(bird);

  base = new TilingSprite(id["base.png"], app.stage.width);
  base.y = screenHeight - base.height;
  mainScene.addChild(base);

  const messageTextStyle = setTextStyle(30, 4, strokeSecondaryCl);
  startGameMessage = new Text("tap to start", messageTextStyle);
  startGameMessage.x = centerXSprite(app.view, startGameMessage);
  startGameMessage.y = screenHeight / 3;
  mainScene.addChild(startGameMessage);

  soundContainer = new Container();
  soundContainer.interactive = true;
  soundContainer.buttonMode = true;
  soundContainer.x = screenWidth - 30;
  soundContainer.y = 10;

  soundOn = new Sprite(id["soundOn.png"]);
  soundOff = new Sprite(id["soundOff.png"]);
  soundOff.visible = false;
  soundContainer.addChild(soundOn, soundOff);
  mainScene.addChild(soundContainer);

  score = new Container();
  score.y = 50;
  mainScene.addChild(score);

  gameOverScene = new Container();
  gameOverScene.visible = false;
  app.stage.addChild(gameOverScene);

  gameOverBackground = new Sprite(id["gameOverBackground.png"]);
  gameOverBackground.scale.x = screenWidth / gameOverBackground.width;

  const gameOverTextStyle = setTextStyle(40, 5, strokePrimaryCl);
  gameOverMessage = new Text("GAME OVER", gameOverTextStyle);
  gameOverMessage.x = centerXSprite(app.view, gameOverMessage);
  gameOverMessage.y = 100;

  const resultTextStyle = setTextStyle(20, 1, strokeSecondaryCl);
  resultMessage = new Text("", resultTextStyle);
  resultMessage.y = gameOverMessage.y + 80;

  const scoreMsgTextStyle = setTextStyle(20);
  const bestScoreMessage = new Text("BEST SCORE", scoreMsgTextStyle);

  bestScoreContainer = new Graphics();
  bestScoreContainer.beginFill(0xddd894);
  bestScoreContainer.drawRoundedRect(0, 0, bestScoreMessage.width + 20, 80);
  bestScoreContainer.endFill();
  bestScoreContainer.x = centerXSprite(app.view, bestScoreContainer);
  bestScoreContainer.y = resultMessage.y + 50;

  bestScoreMessage.x = centerXSprite(bestScoreContainer, bestScoreMessage);
  bestScoreMessage.y = 10;

  const bestScoreTextStyle = new TextStyle({
    fontFamily,
    fontSize: 30,
    fill: darkTextCl,
    fontWeight: 700,
  });
  bestScore = new Text("", bestScoreTextStyle);
  bestScore.y = bestScoreMessage.y + 30;
  bestScoreContainer.addChild(bestScoreMessage, bestScore);

  const buttonTextStyle = setTextStyle(20, 1, strokeSecondaryCl);
  restartButton = createButton(
    { text: "Restart game", textStyle: buttonTextStyle },
    resetGameSettings
  );

  restartButton.x = centerXSprite(app.view, restartButton);
  restartButton.y = screenHeight - 100;

  gameOverScene.addChild(
    gameOverBackground,
    gameOverMessage,
    bestScoreContainer,
    resultMessage,
    restartButton
  );

  mainScene.on("pointerdown", () => {
    isClicked = true;
    isStarted = true;

    bird.vy = birdFlyVelocity;

    sound.play("wing");
  });

  soundContainer.on("pointerdown", (event) => {
    soundOff.visible = soundOff.visible ? false : true;
    soundOn.visible = soundOff.visible ? false : true;

    if (soundOff.visible) {
      sound.context.muted = true;
    } else {
      sound.context.muted = false;
    }

    event.stopPropagation();
  });

  gameState = playGame;

  app.ticker.add((delta) => gameLoop(delta));
}

function gameLoop(delta) {
  gameState(delta);
}

function startGame() {
  score.removeChildren();

  bird.vy = 0.5;
  bird.y += bird.vy * direction;

  if (bird.y === screenHeight / 2 - 10 || bird.y === screenHeight / 2 + 10) {
    direction *= -1;
  }
}

function playGame(delta) {
  base.tilePosition.x -= baseVelocity;

  if (isStarted) {
    startGameMessage.visible = false;
    soundContainer.visible = false;

    tickCount++;

    if (isClicked && tickCount <= 10) {
      accelerationUp = Math.max(Number(accelerationUp - 0.1).toFixed(2), 1);

      bird.y += bird.vy * accelerationUp;

      accelerationDown = 0;
    } else {
      accelerationDown += 0.1;
      bird.y += birdDescendVelocity * accelerationDown;

      accelerationUp = 1.5;
      tickCount = 0;
      isClicked = false;
    }

    if (Math.floor(bird.y + bird.height) >= base.y) {
      gameState = finishGame;
      sound.play("hit");
    }

    if (bird.y <= 0) {
      bird.y = 0;
    }

    barriers.forEach(function (barrier, index, allBarriers) {
      barrier.x -= barrierVelocity;
      const [topBarrier, bottomBarrier] = barrier.children;

      if (checkSpritesHit(bird, barrier)) {
        gameState = finishGame;
        sound.play("hit");
      }

      if (bird.x - topBarrier.width === barrier.x) {
        ++counter;
        showScore(counter);
        sound.play("point");
      }

      if (barrier.x === -topBarrier.width) {
        barrier.x = allBarriers[allBarriers.length - 1].x + distanceBetweenBarrier * (index + 1);
        setRandomBarrierPosition(topBarrier, bottomBarrier);
      }
    });
  } else {
    startGame();
  }
}

function finishGame(delta) {
  base.tilePosition.x -= 0;

  resultMessage.text = `Your result: ${counter}`;
  resultMessage.x = centerXSprite(app.view, resultMessage);

  bird.stop();
  bird.y += birdFallVelocity;

  const savedScore = getValueFromLocalStorage(storageKey);

  if (savedScore) {
    const updatedBestScore = +savedScore > counter ? savedScore : counter;
    bestScore.text = updatedBestScore;
    addValueToLocalStorage(storageKey, updatedBestScore);
  } else {
    bestScore.text = counter;
    addValueToLocalStorage(storageKey, counter);
  }
  bestScore.x = centerXSprite(bestScoreContainer, bestScore);

  const isContained = contain(bird, { height: screenHeight - base.height });

  if (isContained) {
    mainScene.visible = false;
    gameOverScene.visible = true;
  }

  if (!isSoundPlayed) {
    sound.play("die");
    isSoundPlayed = true;
  }
}

function resetGameSettings() {
  gameState = playGame;

  startGameMessage.visible = true;
  soundContainer.visible = true;
  gameOverScene.visible = false;
  mainScene.visible = true;

  isStarted = false;
  isSoundPlayed = false;
  counter = 0;

  bird.x = birdXPos;
  bird.y = birdYPos;
  bird.play();

  barriers.forEach(setStartBarrierPosition);
}

function generateBarrier(topBarrier, bottomBarrier) {
  setRandomBarrierPosition(topBarrier, bottomBarrier);

  topBarrier.scale.set(1, -1);

  const barrier = new Container();
  barrier.addChild(topBarrier, bottomBarrier);

  return barrier;
}

function setRandomBarrierPosition(topBarrier, bottomBarrier) {
  const topBarrierY = randomInt(100, screenHeight / 2);
  const bottomBarrierY = topBarrierY + barriersGapHeight;

  topBarrier.y = topBarrierY;
  bottomBarrier.y = bottomBarrierY;
}

function setStartBarrierPosition(barrier, index) {
  barrier.x = screenWidth + distanceBetweenBarrier * (index + 1);
}

function showScore(counter) {
  const counterStr = counter.toString();

  score.removeChildren();

  for (let i = 0; i < counterStr.length; i++) {
    const digit = new Sprite(id[`${counterStr[i]}.png`]);
    if (i >= 1) {
      digit.x = i * 25;
    }
    score.addChild(digit);
  }
  score.x = centerXSprite(app.view, score);
}

function createButton({ text, textStyle }, clickHandler) {
  const message = new Text(text, textStyle);

  const roundBox = new Graphics();
  roundBox.lineStyle({ width: 2, color: strokeBtnCl, alpha: 1 });
  roundBox.beginFill(backgroundBtnCl);
  roundBox.drawRoundedRect(0, 0, message.width + 20, message.height + 40);
  roundBox.endFill();
  roundBox.interactive = true;
  roundBox.buttonMode = true;
  roundBox.on("click", clickHandler);

  message.x = centerXSprite(roundBox, message);
  message.y = roundBox.height / 2 - message.height / 2;

  roundBox.addChild(message);

  return roundBox;
}

function setTextStyle(fontSize = 20, strokeThickness = 0, strokeCl = strokeSecondaryCl) {
  return new TextStyle({
    fontFamily: fontFamily,
    fontSize,
    fill: [textCl],
    stroke: strokeCl,
    strokeThickness,
    fontWeight,
  });
}

function checkSpritesHit(sprite, group) {
  const [topBarrier, bottomBarrier] = group.children;

  //Define the variables we'll need to calculate
  let hit,
    combinedHalfWidths,
    combinedHalfHeights,
    vx,
    topBarrierVY,
    bottomBarrierVY,
    barrierHalfWidth,
    barrierHalfHeight;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  sprite.centerX = sprite.x + sprite.width / 2;
  sprite.centerY = sprite.y + sprite.height / 2;
  topBarrier.centerX = group.x + topBarrier.width / 2;
  topBarrier.centerY = topBarrier.y - topBarrier.height / 2;
  bottomBarrier.centerY = bottomBarrier.y + bottomBarrier.height / 2;

  //Find the half-widths and half-heights of each sprite
  sprite.halfWidth = sprite.width / 2;
  sprite.halfHeight = sprite.height / 2;
  barrierHalfWidth = topBarrier.width / 2;
  barrierHalfHeight = topBarrier.height / 2;

  //Calculate the distance vector between the sprites
  vx = sprite.centerX - topBarrier.centerX;
  topBarrierVY = sprite.centerY - topBarrier.centerY;
  bottomBarrierVY = sprite.centerY - bottomBarrier.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = sprite.halfWidth + barrierHalfWidth;
  combinedHalfHeights = sprite.halfHeight + barrierHalfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {
    //A collision might be occurring. Check for a collision on the y axis
    if (
      Math.abs(topBarrierVY) < combinedHalfHeights ||
      Math.abs(bottomBarrierVY) < combinedHalfHeights
    ) {
      //There's definitely a collision happening
      hit = true;
    } else {
      //There's no collision on the y axis
      hit = false;
    }
  } else {
    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
}

function contain(sprite, container) {
  // Top;
  // if (sprite.y < container.y) {
  //   sprite.y = container.y - sprite.height;

  // }

  // Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    return true;
  }
}
