(function() {

  var ChatWindow = function() {
    var self = this;
    var contentContainer = $('#chat-content');
    var chatInput = $('#chat-input');
    var playerName = '';
    var inputController = null;
    var messageCallback = null;
    
    self.setPlayerName = function(name) {
      playerName = name;
    };
    
    self.setInputcontroller = function(controller) {
      inputController = controller;
    };
    
    self.addMessage = function(author, message) {
      var line = $('<div/>').addClass('chat-line')
                  .append(
                      $('<span/>').addClass('chat-line-author').text(author))
                  .append(
                      $('<span/>').addClass('chat-line-content').text(message));
                      
     if(author === playerName)
       line.addClass('chat-line-me');     
       
     contentContainer.append(line);
    };
    
    self.addEvent = function(message) {
      var line = $('<div/>').addClass('chat-line')
                  .append(
                      $('<span/>').addClass('chat-event').text(message));         
      contentContainer.append(line);
    };
    
    self.onMessage = function(callback) {
      messageCallback = callback;
    };
    
    var unfocusChat = function() {
      
    };
    
    var addCurrentMessage = function() {
      var message = chatInput.val();
      chatInput.val('');      
      self.addMessage(playerName, message);
      if(messageCallback) messageCallback(message);
    };
    
    var onChatInputFocused = function() {
      inputController.disable();
    };
    
    var onChatInputBlurred = function() {
      inputController.enable();
    };
    
    var onChatKeyPressed = function(ev) {
      if(ev.keyCode === 13)
        addCurrentMessage();
      else if(ev.KeyCode === 27)
        unfocusChat();
    };
        
    chatInput
      .bind('focus',onChatInputFocused)
      .bind('blur', onChatInputBlurred)
      .bind('keydown', onChatKeyPressed);
      
    $('#btn-shout').click(addCurrentMessage);
  };

  $(document).ready(function() {
    GlobalChatModel = new ChatWindow();
  });
})();
