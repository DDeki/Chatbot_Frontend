<template>
  <div id="chat" :class="showChatbot">
    <button class="chatbot-toggler" @click="toggleChatbot()">
      <span class="material-symbols-rounded">mode_comment</span>
      <span class="material-symbols-outlined">close</span>
    </button>
    <div class="chatbot">
      <header>
        <button class="reset-btn" @click="clearMemory" :class="{ 'disabled': isGeneratingResponse }">
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
        <div v-if="recommendedQuestions.length > 0" class="recommendation-container" ref="recommendationContainer">
          <p class="recommendation-title">Preporučena pitanja:</p>
          <div v-for="(rec, index) in recommendedQuestions.slice(0, 2)" :key="index" class="recommended-question" @click="handleRecommendationClick(index)">
            {{ rec.question }}
          </div>
        </div>
      </transition-group>
      <div class="chat-input">
        <textarea v-model="userMessage" placeholder="Unesite pitanje..." spellcheck="false" required ref="chatInputTextArea" @input="adjustTextareaHeight()" @keydown="handleKeydown"></textarea>
        <span class="material-symbols-rounded" @click="handleChat" :class="{ 'disabled': isGeneratingResponse }">send</span>
      </div>
    </div>
    <div v-if="!showChatbot" class="centered-text">
      <p><strong>Upozorenja:</strong></p>
      <p>1. Chatbot može pogrešiti. Preporučujemo da se konsultujete i sa stručnjakom pre donošenja odluka.</p>
      <p>2. Chatbot je namenjen isključivo za informacione svrhe vezane za ISO standarde. Molimo vas da ga ne koristite u druge svrhe.</p>
      <p>3. Ako se chatbot koristi duže vreme ili se menja tema razgovora, savetujemo da izvršite reset.</p>
      <p>4. Nakon jednog sata neaktivnosti, razgovor će biti obrisan.</p>
      <p>5. U samo jednom prozoru možete pričati sa chatbotom, otvaranje novog prozora briše razgovor u prošlom prozoru.</p>
    </div>
  </div>
</template>


<script>
import keycloak from '@/keycloak';

const DELAY = 600;

const WELCOME_MESSAGE = `Zdravo, koje pitanje za ISO standarde imate?
Napomena: Ako menjate temu u razgovoru preporučljivo je da kliknete Resetuj`;

const GENERIC_ERROR_MESSAGE = `Doslo je do greske, proverite internet konekciju i pokusajte ponovo, 
ako se problem nastavi pokusajte kasnije mozda je preveliki saobracaj trenutno. Preporučljivo je i kliknuti Resetuj`;

export default {
  name: 'HomeView',
  data() {
    return {
      userMessage: "",
      messages: [
        {
          type: "incoming",
          text: WELCOME_MESSAGE,
          recommendationIndex: null
        }
      ],
      showChatbot: "show-chatbot",
      inputInitHeight: 0, // To store the initial height of the textarea
      loadingMessageIndex: 0, // To keep track of the current loading message
      loadingInterval: null, // To store the interval ID
      recommendedQuestions: [], // To store the recommended questions
      isGeneratingResponse: false
    };
  },
  methods: {

    closeChatbot() {
      this.showChatbot = "";
    },
    toggleChatbot() {
      this.showChatbot = this.showChatbot ? "" : "show-chatbot";
    },

    sendChat(message, type, recommendationIndex = null) {
      this.messages.push({
        type: type,
        text: message,
        recommendationIndex: recommendationIndex
      });
      this.$nextTick(this.scrollToBottom);
    },

    clearMemory() {
      if (this.isGeneratingResponse) return;

      const username = keycloak.tokenParsed.preferred_username;
      fetch('http://0.0.0.0:8000/api/clear_memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            this.messages = [{
              type: "incoming",
              text: WELCOME_MESSAGE,
              recommendationIndex: null
            }];
          } else {
            this.messages[this.messages.length - 1].text = GENERIC_ERROR_MESSAGE;
          }
          this.recommendedQuestions = [];
          this.$nextTick(this.scrollToBottom);
        })
        .catch(error => {
          this.messages[this.messages.length - 1].text = GENERIC_ERROR_MESSAGE;
          this.recommendedQuestions = [];
          this.$nextTick(this.scrollToBottom);
        });
    },

    generateResponse(message) {
      const username = keycloak.tokenParsed.preferred_username;
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message, username: username })
      };

      fetch('http://0.0.0.0:8000/api/generate_response', requestOptions)
        .then(response => response.json())
        .then(data => {
          clearInterval(this.loadingInterval);
          if (!data.success) {
            this.messages[this.messages.length - 1].text = data.error;
            this.recommendedQuestions = [];

          } else {
            this.messages[this.messages.length - 1].text = data.text;
            
            if (data.recommended_questions && Array.isArray(data.recommended_questions)) {
              this.recommendedQuestions = data.recommended_questions;
            }
          }
          this.isGeneratingResponse = false;
          this.$nextTick(this.scrollToBottom);
        })
        .catch(error => {
          clearInterval(this.loadingInterval);
          this.messages[this.messages.length - 1].text = GENERIC_ERROR_MESSAGE;
          this.recommendedQuestions = [];
          
          this.isGeneratingResponse = false;

          this.$nextTick(this.scrollToBottom);
        });
    },

    handleRecommendationClick(index) {
      this.isGeneratingResponse = true;
      const rec = this.recommendedQuestions[index];

      const recommendationContainer = this.$refs.recommendationContainer;
      recommendationContainer.classList.remove('fade-in');
      recommendationContainer.classList.add('fade-out');

      setTimeout(() => {
        this.sendChat(rec.question, "outgoing");

        setTimeout(() => {
          this.sendChat(rec.answer, "incoming");

          this.recommendedQuestions.splice(index, 1);

          const username = keycloak.tokenParsed.preferred_username;
          fetch('http://0.0.0.0:8000/api/recommended_question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username,
              question: rec.question,
              answer: rec.answer
            })
          })
            .then(response => response.json())
            .then(data => {
              if (!data.success) {
                this.messages[this.messages.length - 1].text = GENERIC_ERROR_MESSAGE;
                this.recommendedQuestions = [];
              }
            })
            .catch(error => {
              this.messages[this.messages.length - 1].text = GENERIC_ERROR_MESSAGE;
              this.recommendedQuestions = [];
            })
            .finally(() => {
              this.$nextTick(() => {
                if (this.recommendedQuestions.length > 0) {
                  recommendationContainer.classList.remove('fade-out');
                  recommendationContainer.classList.add('fade-in');
                }
                this.isGeneratingResponse = false;
              });
            });
        }, 500);
      }, 500);
    },

    handleChat() {
      const message = this.userMessage.trim();
      if (!message) { return; }
      if (!message || this.isGeneratingResponse) { 
          return;
        }
      
      this.recommendedQuestions = [];
      //this.messages = this.messages.filter(message => message.type !== "recommendation" && message.type !== "recommendation-title");

      this.sendChat(message, "outgoing");
      this.userMessage = "";

      const chatInput = this.$refs.chatInputTextArea;
      chatInput.style.height = `${this.inputInitHeight}px`;

      this.isGeneratingResponse = true;

      setTimeout(() => {
        this.sendChat("", "incoming");
        this.startLoadingAnimation();
        this.generateResponse(message);
      }, DELAY);
    },

    adjustTextareaHeight() {
      const chatInput = this.$refs.chatInputTextArea;
      if (!this.inputInitHeight) {
        this.inputInitHeight = chatInput.scrollHeight;
      }

      chatInput.style.height = `${this.inputInitHeight}px`;
      chatInput.style.height = `${chatInput.scrollHeight}px`;
    },

    handleKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        this.handleChat();
      }
    },

    startLoadingAnimation() {
      const loadingStates = ["Traženje odgovora.", "Traženje odgovora..", "Traženje odgovora..."];
      this.loadingMessageIndex = 0;

      this.loadingInterval = setInterval(() => {
        this.loadingMessageIndex = (this.loadingMessageIndex + 1) % loadingStates.length;
        this.messages[this.messages.length - 1].text = loadingStates[this.loadingMessageIndex];
      }, 500); // 0.5s
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const chatbox = this.$refs.chatbox.$el || this.$refs.chatbox;
        if (chatbox && chatbox.nodeType === 1) {
          console.log("Forced scroll to bottom:", chatbox.scrollTop, chatbox.scrollHeight, chatbox);
          chatbox.scrollTop = chatbox.scrollHeight;
        }
      });
    }
  },
  updated() {
    // when user is typing called after every change
  },
  mounted() {
    this.$nextTick(this.adjustTextareaHeight);
    this.clearMemory();

    if (window.location.href.indexOf('state=') !== -1) {
      window.history.replaceState({}, document.title, "/iso_chatbot/");
    }

    document.cookie = "key=value; SameSite=None; Secure";
  }
}
</script>



<style src="../components/ChatBotStyle.css"></style>
