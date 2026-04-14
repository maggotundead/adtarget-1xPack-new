let _EVENTS = {};

function subscribe(event, callback) {

  _EVENTS[event] ??= [];

  // Do not duplicate subscriptions
  if (_EVENTS[event].includes(callback)) {
    return _EVENTS[event].length;
  } else {
    return _EVENTS[event].push(callback);
  }

}

function unSubscribe(event, callback) {

}

/*
 If the passed event has callbacks attached to it,
 loop through each one and call it
 =====================================================*/

function publish(event, data = {}) {

  // let topics = event.split(".");
  // console.log("~~~~ Emit events:");
  // do {
  //   console.log(event);
  //   if (_EVENTS.hasOwnProperty(event)) {
  //     _EVENTS[event].map(callback => callback(data));
  //   }
  //   topics.pop();
  //   event = topics.join(".");
  // } while (topics.length > 0);

  console.log("~~~~ Emit event: " + event);
  console.log("~~~~ Width Data:");
  console.log(data);

  if (_EVENTS.hasOwnProperty(event)) {
    _EVENTS[event].map(callback => callback(data));
  }

}

function clearAllSubscriptions() {
  // Except brand events!!! And Data?
  // console.log("---------------------");
  // console.log(_EVENTS);
  // console.log("---------------------");

  // _EVENTS = {};
  for (let k in _EVENTS) {
    k.startsWith("brand") || delete (_EVENTS[k]);
  }


}

// const PubSub = {
//   subscribe,
//   publish
// };

// export default PubSub;

export {
  subscribe,
  publish,
  clearAllSubscriptions
};