<template>
  <div id="chat" :class="showChatbot">
    <button class="chatbot-toggler" @click = toggleChatbot()>
      <span class="material-symbols-rounded">mode_comment</span>
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="chatbot">
      <header>
        <h2>ISO Chatbot</h2>
        <span class="close-btn material-symbols-outlined" @click="closeChatbot">close</span>
      </header>
      <ul class="chatbox" ref="chatbox">
        <li v-for="(message, index) in messages" :key="index" :class="`chat ${message.type === 'incoming' ? 'incoming' : 'outgoing'}`">
          <span class="material-symbols-outlined" v-if="message.type === 'incoming'">smart_toy</span>
          <p v-html="message.text"></p>
        </li>
      </ul>
      <div class="chat-input">
        <textarea v-model="userMessage" placeholder="Unesite pitanje..." spellcheck="false" required ref="chatInputTextArea" @input = adjustTextareaHeight() @keydown="handleKeydown"></textarea>
        <span class="material-symbols-rounded" @click="handleChat">send</span>
      </div>
    </div>
  </div>
</template>


<script>
// @ is an alias to /src
export default {
  name: 'HomeView',
  components: {
   
  },
  data() {
    return {
      userMessage: "",
      messages: [
        {
          type: "incoming",
          text: "Zdravo, kako Vam mogu pomoći danas?"
        }
      ],
      showChatbot: "",
      inputInitHeight: 0 // To store the initial height of the textarea
    };
  },
  methods: {
      /* Show and hide the chatbot */
      closeChatbot() {
        this.showChatbot = "";
     
      },
      toggleChatbot() {
        this.showChatbot = this.showChatbot ? "" : "show-chatbot";
      },

      /* Putting message in the chatbox */
      sendChat(message, type) {
        this.messages.push({
          type: type,
          text: message
        });
      },

      /* Generate a response */
      generateResponse(message){
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message})
        };
        fetch('http://0.0.0.0:80/post', requestOptions)
        .then(async response => {
          const data = await response.json();
          const newText = data.text.response;

          if (newText.startsWith("Repeat:")) {
              // Remove "Repeat:" from the beginning of the string
              this.messages[this.messages.length - 1].text = newText.substring("Repeat: ".length);
          } else {
              // If the string doesn't start with "Repeat:", keep it as it is
              this.messages[this.messages.length - 1].text = newText;
          }
        })
        .catch(error => {
          this.errorMessage = error;
          console.error('Došlo je do greške!', error);
        });
      },

      /* Handling the chat */
      handleChat() {
        // User sending a message 
        const message = this.userMessage.trim();
        if (!message) { return;}
        this.sendChat(message, "outgoing");
        this.userMessage = "";

        // Reset the textarea height after sending the message
        const chatInput = this.$refs.chatInputTextArea;
        chatInput.style.height = `${this.inputInitHeight}px`;

        // Bot responding
        setTimeout(() => {
          this.sendChat("Traženje odgovora...", "incoming");
          this.generateResponse(message);
        }, 600);
      },

      /* Adjusting the textarea height */
      adjustTextareaHeight() {
        const chatInput = this.$refs.chatInputTextArea;
        if (!this.inputInitHeight) {
          this.inputInitHeight = chatInput.scrollHeight;
        }
        // Reset the element's height to its initial height before calculating the new height,
        // to ensure accurate calculation if the content's height is now less than before
        chatInput.style.height = `${this.inputInitHeight}px`;
        chatInput.style.height = `${chatInput.scrollHeight}px`;
      },

      handleKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
          e.preventDefault(); // Prevent the default action to avoid adding a new line
          this.handleChat(); // Call the method to handle the chat
        }
      },
  },
  updated() {
        const chatbox = this.$refs.chatbox;
        if (chatbox) {
          chatbox.scrollTop = chatbox.scrollHeight;
        }
  },
  mounted() {
    // Optionally, adjust the height when the component mounts in case there is initial content
    this.$nextTick(this.adjustTextareaHeight);
  }
}
</script>


<style src="../components/ChatBotStyle.css"></style>