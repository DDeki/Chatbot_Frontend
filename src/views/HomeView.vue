<template>
  <div id="chat" :class="showChatbot">
    <button class="chatbot-toggler" @click = toggleChatbot()>
      <span class="material-symbols-rounded">mode_comment</span>
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="chatbot">
      <header>
        <button class="reset-btn" @click="clearMemory">
          <i class="fas fa-sync-alt"></i> Resetuj
        </button>
        <h2>ISO Chatbot&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h2>
        <span class="close-btn material-symbols-outlined" @click="closeChatbot">close</span>
      </header>
        <transition-group name="chat" tag="ul" class="chatbox" ref="chatbox">
          <li v-for="(message, index) in messages" :key="index" :class="`chat ${message.type === 'incoming' ? 'incoming' : 'outgoing'}`">
            <span class="material-symbols-outlined" v-if="message.type === 'incoming'">smart_toy</span>
            <p v-html="message.text"></p>
          </li>
        </transition-group>
      <div class="chat-input">
        <textarea v-model="userMessage" placeholder="Unesite pitanje..." spellcheck="false" required ref="chatInputTextArea" @input = adjustTextareaHeight() @keydown="handleKeydown"></textarea>
        <span class="material-symbols-rounded" @click="handleChat">send</span>
      </div>
    </div>
  </div>
</template>


<script>
// @ is an alias to /src
const WELCOME_MESSAGE = `Zdravo, kako Vam mogu pomoći danas?
Napomena: Ako menjate temu u razgovoru preporučljivo je da kliknete Resetuj
`;

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
          text: WELCOME_MESSAGE
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


      /* Clearing a chat history */
      clearMemory() {
        fetch('http://0.0.0.0:80/post/clear_memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}) // No data is needed to send
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Clear messages in the UI
            this.messages = [{
              type: "incoming",
              text: WELCOME_MESSAGE
            }];

          } else {
            // Handle error returned by the server
            console.error('Error:', error);
            this.messages[this.messages.length - 1].text = data.error
          }
        })
        .catch(error => {
          // Handle network or other errors
          console.error('Error:', error);
          this.messages[this.messages.length - 1].text = "Doslo je do greske, proverite internet konekciju i pokusajte ponovo, ako se problem nastavi pokusajte kasnije mozda je preveliki saobracaj trenutno.", "incoming"

        });
      },

      

      generateResponse(message) {
        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        };
        fetch('http://0.0.0.0:80/post/generate_response', requestOptions)
        .then(response => response.json())
        .then(data => {
          if (!data.success) {
            // Display the error message from the server in the chat interface
            console.error('Error:', error);
            this.messages[this.messages.length - 1].text = data.error
          } else {

            // Check if the response text starts with "Repeat:"
            const newText = data.text.response;
            if (newText.startsWith("Repeat:")) {
              // Remove "Repeat:" from the beginning of the string
              this.messages[this.messages.length - 1].text = newText.substring("Repeat: ".length)
            } else {
              // If the string doesn't start with "Repeat:", display it as is
              this.messages[this.messages.length - 1].text = newText
            }
          }
        })
        .catch(error => {
          // Handle network or other errors
          console.error('Error:', error);
          this.messages[this.messages.length - 1].text = "Doslo je do greske, proverite internet konekciju i pokusajte ponovo, ako se problem nastavi pokusajte kasnije mozda je preveliki saobracaj trenutno.", "incoming"
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