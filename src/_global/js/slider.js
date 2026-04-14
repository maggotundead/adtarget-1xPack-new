import { utils } from "../modules/utils";

const config = {
  isShotMode: false,
  isInfinite: true,
  contain: false,
  autoPlay: true,
  startCardId: 0,
  autoPlayInterval: 3000,

  friction: 0.35, // friction when selecting
  attraction: 0.028, // attraction

  dragStartThreshold: 5, // * window.devicePixelRatio, // px to start dragging
};

let slider, // Viewport
  sliderRect,
  sliderStripe,
  cardsGap,
  sliderHorizontalPadding,
  stripeWidth;

let cards = []; // Cards collection
let currentCardId = 0;
let selectedCard;

// For infinite mode
let clonedCardsLeft = [];
let clonedCardsRight = [];
let leftCloneGap = 0;
let rightCloneGap = 0;

let isPointerDown = false;
let pointerDownX = 0;
let wasDragStarted = false;
let isAnimating = false;

let dragX = 0;
let dragStartX = 0;
let dragVectorX = 0;
let previousDragX = 0;
let dragMoveTime;
let isDragSelect = false;

let minSliderX = 0;
let maxSliderX = 0;

// Координаты без учёта краёв.
let currentX = 0;

// How many frames slider has been in same position
let restingFrames = 0;
// initial physics properties
let velocity = 0;

let autoPlayTimeoutId;
let initTimeoutId;
let rafId;

export default function createSlider(sliderContainer, items, options = {}) {

  if (!Array.isArray(items) || items.length < 1)
    return;


  slider = sliderContainer;
  // options = { ...config, ...options };
  // Object.assign(config, options);

  for (const prop in config) {
    config[prop] = options[prop] ?? config[prop];
  }

  // console.log(config);

  currentCardId = config.startCardId;

  // Image loading handlers

  slider.addEventListener(
    "load",
    (e) => {
      if (e.target.tagName.toLowerCase() === "img") {
        e.target.closest(".media").classList.remove("loading");
      }
    },
    true
  );

  slider.addEventListener(
    "error",
    (e) => {
      if (e.target.tagName.toLowerCase() === "img") {
        e.target.closest(".media").classList.replace("loading", "error");
      }
    },
    true
  );


  makeCardStripe(items);


  // Watch for window resize
  window.addEventListener("resize", handleResize);

  // Watch slider viewport change
  sliderResizeObserver.observe(slider, { box: "border-box" });

  bindPointerEvents();


  // // Get initial slider dimensions and prepare...
  // // Give browser some time to apply styling to new elemensts.
  // initTimeoutId = setTimeout(() => {
  //   initSlider();
  // }, 50);
}

function makeCardStripe(items) {

  cancelAnimationFrame(rafId);

  slider.removeAttribute("class");
  clearTimeout(initTimeoutId);
  cardResizeObserver.disconnect();
  stopAutoplay();

  // clearing all previous data

  cards.length = 0;
  currentCardId = 0;
  selectedCard = undefined;

  // For infinite mode
  clonedCardsLeft.length = 0;
  clonedCardsRight.length = 0;
  leftCloneGap = 0;
  rightCloneGap = 0;

  isPointerDown = false;
  pointerDownX = 0;
  wasDragStarted = false;
  isAnimating = false;

  dragX = 0;
  dragStartX = 0;
  dragVectorX = 0;
  previousDragX = 0;
  dragMoveTime = undefined;
  isDragSelect = false;

  minSliderX = 0;
  maxSliderX = 0;

  // Координаты без учёта краёв.
  currentX = 0;

  // How many frames slider has been in same position
  restingFrames = 0;
  // initial physics properties
  velocity = 0;



  // Clear slider container
  slider.innerText = "";

  if (items.length < 1) {
    return;
  } else if (items.length == 1) {
    config.isInfinite = false;
  }

  // Create slider stripe
  sliderStripe = document.createElement("ul");

  items.forEach((item, i) => {
    const card = document.createElement("li");
    card.classList.add("card");

    card.dataset.id = i;

    let isLazy = !config.isShotMode && !config.isInfinite ? 'loading="lazy"' : "";

    card.innerHTML +=
      "" +
      '<div class="media ' +
      (item.image ? "loading" : "error") +
      '">' +
      (item.image ? `  <img draggable="false" ${isLazy} src="${item.image}">` : "") +
      `  <span class="discount">${item.discount}</span>` +
      "</div>" +
      '<div class="meta">' +
      `  <h4 class="title">${item.name}</h4>` +
      '  <div class="price">' +
      `    <span class="sale">${item.salePrice}</span>` +
      `    <span class="regular">${item.regularPrice}</span>` +
      "  </div>" +
      "</div>" +
      `<a href="${item.link}" target="_blank"></a>`;

    // Add card to collection
    cards.push({
      element: card,
      id: i,
      targetX: 0,
    });

    sliderStripe.appendChild(card);
  });

  slider.appendChild(sliderStripe);

  // Get initial slider dimensions and prepare...
  // Give browser some time to apply styling to new elemensts.
  initTimeoutId = setTimeout(() => {
    initSlider();
  }, 50);
}

/* Init
 *******************************************************/

function initSlider() {
  let cardStyle = getComputedStyle(cards[0].element);
  cardsGap = parseFloat(cardStyle.getPropertyValue("margin-right"));

  let sliderStyle = getComputedStyle(slider);
  sliderHorizontalPadding = parseFloat(sliderStyle.getPropertyValue("--vertical-padding"));

  sliderRect = slider.getBoundingClientRect();

  // Round slider stripe height
  sliderStripe.style.height = Math.floor(sliderRect.height) + "px";

  stripeWidth = 0;

  cards.forEach((card, i) => {
    card.width = card.element.getBoundingClientRect().width;
    card.targetX = stripeWidth + card.width / 2;
    stripeWidth += card.width + cardsGap;
    // Watch for future card size changes if any ...
    cardResizeObserver.observe(card.element, { box: "border-box" });
  });

  if (config.isInfinite) {
    addEdgeClones();
    minSliderX = sliderRect.width - stripeWidth;
    maxSliderX = cardsGap;
  } else {
    _containCards();
    minSliderX = -cards[cards.length - 1].targetX;
    maxSliderX = -cards[0].targetX;
  }

  currentX = maxSliderX - leftCloneGap;

  select(currentCardId, false, true);


  if (document.visibilityState === "visible") {
    // Autoplay
    startAutoplay();
  }
}

function startAutoplay(timeout) {
  clearTimeout(autoPlayTimeoutId);

  if (config.autoPlay && cards.length > 1) {
    autoplay(timeout || config.autoPlayInterval);
  }
}

function autoplay(timeout) {
  clearTimeout(autoPlayTimeoutId);

  autoPlayTimeoutId = setTimeout(() => {
    nextCard(true);
    autoplay();
  }, timeout || config.autoPlayInterval);
}

function stopAutoplay() {
  clearTimeout(autoPlayTimeoutId);
}

/* Clone cards for infinite scroll wrap
 *******************************************************/

function addEdgeClones() {
  leftCloneGap = 0;
  let i = cards.length - 1;

  // Need some DRY here
  // What if not enoucht cards for edges ?

  do {
    let edgeElement = cards[i].element.cloneNode(true);
    edgeElement.className = "card clone";
    leftCloneGap += cards[i].width + cardsGap;
    sliderStripe.prepend(edgeElement);
    clonedCardsLeft.push({
      element: edgeElement,
      card: cards[i],
    });
    i--;
  } while (leftCloneGap < sliderRect.width / 2);

  rightCloneGap = 0;
  i = 0;

  do {
    let edgeElement = cards[i].element.cloneNode(true);
    edgeElement.className = "card clone";
    sliderStripe.append(edgeElement);
    rightCloneGap += cards[i].width + cardsGap;
    clonedCardsRight.push({
      element: edgeElement,
      card: cards[i],
    });
    i++;
  } while (rightCloneGap < sliderRect.width / 2);
}

/* Contain card targets so no excess sliding
 ****************************************************/

function _containCards() {
  let isContaining = config.contain && !config.isInfinite && cards.length;
  if (!isContaining) return;

  let contentWidth = stripeWidth - cardsGap;
  // content is less than slider size
  let isContentSmaller = contentWidth < sliderRect.width;
  if (isContentSmaller) {
    // all cards fit inside slider
    cards.forEach((card) => {
      card.targetX = contentWidth * 0.5;
    });
  } else {
    // contain to bounds
    let beginBound = sliderRect.width / 2 - sliderHorizontalPadding;
    let endBound = contentWidth - sliderRect.width / 2 + sliderHorizontalPadding;
    cards.forEach((card) => {
      card.targetX = Math.max(card.targetX, beginBound);
      card.targetX = Math.min(card.targetX, endBound);
    });
  }
}

/* Pointer events
 ***********************************/

function bindPointerEvents() {
  slider.addEventListener("pointercancel", (e) => {
    console.log("Pointer cancel event fired!!!");
    console.log(e);
  });

  /* Autopay events
   ******************/
  slider.addEventListener("pointerenter", (e) => {
    // console.log("pointerEnter");
    stopAutoplay();
  });

  slider.addEventListener("pointerleave", (e) => {
    // console.log("pointerLeave");
    if (e.pointerType === "touch") {
      startAutoplay(config.autoPlayInterval * 2);
    } else {
      startAutoplay();
    }
  });

  document.addEventListener("visibilitychange", (e) => {
    console.log(document.visibilityState);
    if (document.visibilityState === "visible") {
      startAutoplay(config.autoPlayInterval / 2);
    } else {
      stopAutoplay();
    }
  });

  /* Slider events
   ******************/

  slider.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary) return;

    isPointerDown = true;
    wasDragStarted = false;

    // stop if it was moving
    dragX = currentX;

    pointerDownX = e.clientX;

    slider.addEventListener("pointermove", dragCards);
    slider.addEventListener("pointerup", stopCardsDrag, true);

    slider.classList.add("pointer-down");
  });

  /* DRAGGING
   *************************************************************/

  function dragCards(e) {
    if (!e.isPrimary) return;

    dragVectorX = e.clientX - pointerDownX;

    if (!wasDragStarted) {
      if (Math.abs(pointerDownX - e.clientX) >= config.dragStartThreshold) {
        wasDragStarted = true;
        slider.classList.add("dragging");
        slider.setPointerCapture(e.pointerId);

        dragStartX = currentX;
        startAnimation();
      } else {
        return;
      }
    }

    // NO scroll if moving!
    e.preventDefault();

    previousDragX = dragX;

    // wrap around move. #589
    if (config.isInfinite) dragVectorX %= stripeWidth;

    let nextDragX = dragStartX + dragVectorX;

    if (!config.isInfinite) {
      let scale = 50;
      if (nextDragX < minSliderX) {
        // https://taye.me/blog/interact-js/2013/10/28/how-to-elastic-overscroll-1.html
        nextDragX = minSliderX - scale * (Math.log(Math.abs(nextDragX - minSliderX) + scale) - Math.log(scale));
      } else if (nextDragX > maxSliderX) {
        nextDragX = maxSliderX + scale * (Math.log(Math.abs(nextDragX - maxSliderX) + scale) - Math.log(scale));
      }
    }

    dragX = nextDragX;
    dragMoveTime = e.timeStamp; // Date.now();
  }

  function stopCardsDrag(e) {
    if (!e.isPrimary) return;

    isPointerDown = false;

    if (slider.hasPointerCapture(e.pointerId)) {
      slider.releasePointerCapture(e.pointerId);
    }

    slider.removeEventListener("pointermove", dragCards);
    slider.removeEventListener("pointerup", stopCardsDrag);

    slider.classList.remove("pointer-down");

    if (!wasDragStarted) {
      let clickedCardId = parseInt(e.target.dataset.id);

      if (clickedCardId == currentCardId) {
        //window.open(config.clickURL); // Попапы блокируются.
        e.target.querySelector("a").click();
      } else {
        select(clickedCardId);
      }
      return;
    }

    slider.classList.remove("dragging");

    // set selectedIndex based on where flick will end up
    let index = dragEndRestingSelect();

    if (index === currentCardId) {
      // boost selection if selected index has not changed
      index += dragEndBoostSelect(e);
    }

    previousDragX = undefined;
    // apply selection
    // HACK, set flag so dragging stays in correct direction
    isDragSelect = true; //isWrapping;
    select(index);
    isDragSelect = false;
  }
}

/* Resize handling...
 ************************************************/

const handleResize = utils.debounce((ev) => {
  // Get cards gap
  let cardStyle = getComputedStyle(cards[0].element); // gaps are same for all cards
  cardsGap = parseFloat(cardStyle.getPropertyValue("margin-right"));

  // sliderStripe.style.display = "none";
  sliderRect = slider.getBoundingClientRect();
  // sliderStripe.style.display = "";

  // Round slider stripe height
  sliderStripe.style.height = Math.floor(sliderRect.height) + "px";

  stripeWidth = cards.reduce((total, card, i, array) => {
    card.targetX = total + card.width / 2;
    return total + (cardsGap + card.width);
  }, 0);

  if (config.isInfinite) {
    minSliderX = sliderRect.width - stripeWidth;
    maxSliderX = cardsGap;

    leftCloneGap = clonedCardsLeft.reduce((total, clone) => {
      return total + (cardsGap + clone.card.width);
    }, 0);

    rightCloneGap = clonedCardsRight.reduce((total, clone) => {
      return total + (cardsGap + clone.card.width);
    }, 0);

    if (leftCloneGap < sliderRect.width / 2 || rightCloneGap < sliderRect.width / 2) {
      console.log("Rebuild edge clones...");

      [...clonedCardsLeft.splice(0), ...clonedCardsRight.splice(0)].forEach((clone) => clone.element.remove());

      addEdgeClones();
    }
  } else {
    _containCards();

    minSliderX = -cards[cards.length - 1].targetX;
    maxSliderX = -cards[0].targetX;
  }

  select(currentCardId, false, false);
}, 150);

/* Collect cards size changes
 *******************************/

const cardResizeObserver = new ResizeObserver((entries) => {
  // cards - ResizeObserverEntries

  // let minCardId = cards.length;

  // Update only changed dimensions...
  for (const entry of entries) {
    const cardWidth = entry.borderBoxSize?.length > 0 ? entry.borderBoxSize[0].inlineSize : entry.contentRect.width; // contentRect - better support
    const cardId = entry.target.dataset.id;
    cards[cardId].width = cardWidth;
    // minCardId = Math.min(cardId, minCardId);
  }

  // ...and schedule handling.
  handleResize();
});

const sliderResizeObserver = new ResizeObserver((entries) => {
  // Update viewport
  for (const entry of entries) {
    const sliderHeight = entry.borderBoxSize?.length > 0 ? entry.borderBoxSize[0].blockSize : entry.contentRect.height; // contentRect - better support
    // Round slider stripe height
    sliderStripe.style.height = Math.floor(sliderHeight) + "px";
  }
});

/****************************************************************************/
function startAnimation() {
  if (isAnimating) return;

  isAnimating = true;
  restingFrames = 0;
  animate();

  slider.classList.add("animating");
}

function animate() {
  applyDragForce();
  applySelectedAttraction();

  let previousX = currentX;

  integratePhysics();
  positionSlider();
  settle(previousX);
  // animate next frame
  if (isAnimating) {
    rafId = requestAnimationFrame(() => animate());
  }
}

function positionSlider() {
  let x = currentX;
  // wrap position around
  if (config.isInfinite) {
    x = utils.modulo(x, stripeWidth) - stripeWidth;
  }

  let progress = Math.round(utils.clamp(((-x - cards[0].targetX) / (cards[cards.length - 1].targetX - cards[0].targetX)) * 10000, 0, 10000)) / 100;
  // document.documentElement.style.setProperty("--slider-progress", progress.toFixed(2) + "%");
  document.body.style.setProperty("--slider-progress", progress.toFixed(2) + "%");

  setTranslateX(x, isAnimating);
}

function setTranslateX(x, is3d) {
  x += sliderRect.width / 2 - leftCloneGap;

  // use 3D transforms for hardware acceleration on iOS
  // but use 2D when settled, for better font-rendering
  sliderStripe.style.transform = is3d ? `translate3d(${x}px,0,0)` : `translateX(${Math.round(x)}px)`;
}

function positionSliderAtSelected() {
  if (!cards.length) return;

  currentX = -selectedCard.targetX;
  velocity = 0; // stop wobble
  positionSlider();
}

function settle(previousX) {
  // keep track of frames where x hasn't moved
  let isResting = !isPointerDown && Math.round(currentX * 10) === Math.round(previousX * 10);
  if (isResting) restingFrames++;
  // stop animating if resting for 3 or more frames
  if (restingFrames > 3) {
    isAnimating = false;
    slider.classList.remove("animating");
    currentX = -selectedCard.targetX;
    // render position with translateX when settled
    positionSlider();
  }
}

/*
 DRAG END
 */

function dragEndRestingSelect() {
  // Predicting slider position
  let restingX = getRestingPosition();

  // How far away from selected card
  let distance = Math.abs(getCardDistance(-restingX, currentCardId));

  // Get closet resting going up and going down
  let positiveResting = _getClosestResting(restingX, distance, 1);
  let negativeResting = _getClosestResting(restingX, distance, -1);

  // use closer resting for wrap-around
  return positiveResting.distance < negativeResting.distance ? positiveResting.index : negativeResting.index;
}

function _getClosestResting(restingX, distance, increment) {
  let index = currentCardId;
  let minDistance = Infinity;

  let condition =
    config.contain && !config.isInfinite
      ? // if containing, keep going if distance is equal to minDistance
      (dist, minDist) => dist <= minDist
      : (dist, minDist) => dist < minDist;

  while (condition(distance, minDistance)) {
    // measure distance to next card
    index += increment;
    minDistance = distance;
    distance = getCardDistance(-restingX, index);

    if (distance === null) break;

    distance = Math.abs(distance);
  }

  return {
    distance: minDistance,
    // selected was previous index
    index: index - increment,
  };
}

/* Measure distance between x and a card target
 *************************************************/

function getCardDistance(x, index) {
  let len = cards.length;
  // wrap around if at least 2 cards
  let isWrapAround = config.isInfinite && len > 1;
  let cardIndex = isWrapAround ? utils.modulo(index, len) : index;
  let card = cards[cardIndex];
  if (!card) return null;

  // add distance for wrap-around cards
  let wrap = isWrapAround ? stripeWidth * Math.floor(index / len) : 0;
  return x - (card.targetX + wrap);
}

/* Boost to next or prev if drag a little
 *************************************************/

function dragEndBoostSelect(e) {
  // do not boost if no previousDragX or dragMoveTime
  if (
    previousDragX === undefined ||
    !dragMoveTime ||
    // or if drag was held for 100 ms
    // Date.now()
    e.timeStamp - dragMoveTime > 100
  ) {
    return 0;
  }

  let distance = getCardDistance(-dragX, currentCardId);
  let delta = previousDragX - dragX;
  if (distance > 0 && delta > 0) {
    // boost to next if moving towards the right, and positive velocity
    return 1;
  } else if (distance < 0 && delta < 0) {
    // boost to previous if moving towards the left, and negative velocity
    return -1;
  }

  return 0;
}

/* Select card
 *************************************************/

function select(index, isWrap, isInstant) {
  _wrapSelect(index);

  if (config.isInfinite || isWrap) {
    index = utils.modulo(index, cards.length);
  }

  // Cancel if invalid index
  if (!cards[index]) return;

  currentCardId = index;

  updateSelectedCard();

  if (isInstant) {
    positionSliderAtSelected();
  } else {
    startAnimation();
  }
}

/* Wraps position for wrapAround, to move to closest card.
 **************************************************************/

function _wrapSelect(index) {
  if (!config.isInfinite) return;

  // shift index for wrap, do not wrap if dragSelect
  if (!isDragSelect) {
    let wrapIndex = utils.modulo(index, cards.length);
    // go to shortest
    let delta = Math.abs(wrapIndex - currentCardId);
    let backwardWrapDelta = Math.abs(wrapIndex + cards.length - currentCardId);
    let forewardWrapDelta = Math.abs(wrapIndex - cards.length - currentCardId);
    if (backwardWrapDelta < delta) {
      index += cards.length;
    } else if (forewardWrapDelta < delta) {
      index -= cards.length;
    }
  }

  // wrap position so slider is within normal area
  if (index < 0) {
    currentX -= stripeWidth;
  } else if (index >= cards.length) {
    currentX += stripeWidth;
  }
}

function prevCard(isWrap, isInstant) {
  select(currentCardId - 1, isWrap, isInstant);
}

function nextCard(isWrap, isInstant) {
  select(currentCardId + 1, isWrap, isInstant);
}

/* Update selected cards and unselect previous.
 **************************************************************/

function updateSelectedCard() {
  let card = cards[currentCardId];
  // selectedIndex could be outside of cards, if triggered too early
  if (!card) return;

  // let progress = ((currentCardId + 1) / cards.length) * 100;
  // document.documentElement.style.setProperty("--slider-progress", progress.toFixed(2) + "%");

  // unselect previously selected card
  if (selectedCard) {
    if (config.isInfinite) {
      // do same with clones if any ...
      document.querySelectorAll(`.card[data-id="${selectedCard.id}"]`).forEach((element) => {
        element.classList.remove("current");
      });
    } else {
      selectedCard.element.classList.remove("current");
    }
  }

  // update new selected card
  selectedCard = card;
  if (config.isInfinite) {
    // do same with clones if any ...
    document.querySelectorAll(`.card[data-id="${selectedCard.id}"]`).forEach((element) => {
      element.classList.add("current");
    });
  } else {
    selectedCard.element.classList.add("current");
  }
}

// -------------------------- physics -------------------------- //

function integratePhysics() {
  currentX += velocity;
  velocity *= getFrictionFactor();
}

function getFrictionFactor() {
  return 1 - config.friction;
}

/* Predict where slider will stop
 ************************************/
function getRestingPosition() {
  return currentX + velocity / (1 - getFrictionFactor());
}

function applyDragForce() {
  if (!isPointerDown) return;

  // change the position to drag position by applying force
  let dragVelocity = dragX - currentX;
  let dragForce = dragVelocity - velocity;
  applyForce(dragForce);
}

function applyForce(force) {
  velocity += force;
}

function applySelectedAttraction() {
  // Do not attract if pointer down
  if (isPointerDown) return;

  let distance = -selectedCard.targetX - currentX;
  let force = distance * config.attraction;
  applyForce(force);
}



/* API
=====================================================*/

export {
  config,
  createSlider,
  startAutoplay,
  stopAutoplay,
  makeCardStripe,
  nextCard
}