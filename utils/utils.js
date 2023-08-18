const gameSettings = {
  barrierVelocity: 1,
  distanceBetweenBarrier: 240,
  // 70 <= value >= 150
  barriersGapHeight: 100,
  numberOfBarriers: 3,

  birdFlyVelocity: -5,
  birdDescendVelocity: 1,
  // Game Over state
  birdFallVelocity: 4,

  baseVelocity: 2,

  storageKey: "flappyBirdBestScore",
};

const globalTextStyle = {
  fontFamily: "PressStart2P, cursive",
  fontWeight: 700,
  textCl: "#fca146",
  darkTextCl: "#68585d",
  strokePrimaryCl: "#ffffff",
  strokeSecondaryCl: "#000000",
};

const globalButtonStyle = {
  backgroundBtnCl: 0x68585d,
  strokeBtnCl: 0xffffff,
};

// localStorage service
function addValueToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.log(error);
  }
}

function getValueFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    return JSON.parse(serializedState);
  } catch (error) {
    console.log(error);
  }
}

// min-max randomize
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function centerXSprite(container, sprite) {
  return container.width / 2 - sprite.width / 2;
}
