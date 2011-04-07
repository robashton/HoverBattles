var blah = blah || {};

blah.KeyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

blah.KeyboardStates = {};

document.onkeydown = function(event) { 
    blah.KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    blah.KeyboardStates[event.keyCode] = false;
};