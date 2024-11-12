<template>
  <div class="flex flex-col relative mx-2.5 w-80 z-99999 ring chat-panel">
    <header class="px-2 py-4 flex flex-row items-center bg-teal-700">
      <i
        class="fas fa-solid fa-times shrink mx-2 text-white cursor-pointer"
        title="close"
        @click="$emit('onCloseChat', user)"
      ></i>
      <div class="flex-2 grow basis-1/2 text-white">{{ user.name }}</div>
    </header>
    <section
      class="px-2 py-4 h-72 overflow-y-scroll chat-panel-content"
      ref="chatContentRef"
      @scroll="handleChatScroll"
    >
      <i
        class="fas fa-circle-notch fa-spin absolute left-36 top-16 text-3xl"
        v-if="loading"
      ></i>
      <ul>
        <MessageLine v-for="msg in userMessages" :key="msg.id" :message="msg" />
      </ul>
    </section>

      <footer class="flex flex-row items-center chat-panel-footer relative"> <!-- Added relative here -->
    <a
      href="#"
      @click="submitMessage"
      class="px-1 h-full bg-blue-700 text-white items-center flex"
    >
      <i class="fas fa-solid fa-paper-plane mx-1"></i>
      Send
    </a>
    <button class="text-xl font-bold text-gray-600 mx-1" type="button" title="add emoji" @click="showEmojiList">&#128512;</button>
    <textarea
      v-model="messageContent"
      name="currentMessage"
      class="grow p-2 border border-solid border-gray-300"
    ></textarea>
    
    <!-- Position Emojis component here -->
    <div v-if="emojiBtnClicked" class="absolute bottom-10 left-0 z-10"> <!-- Adjusted for position -->
      <Emojis @onSelect="handleSelectEmoji" @onClose="emojiBtnClicked = false" />
    </div>
  </footer>
  </div>
</template>

<script>
import MessageLine from "@/chat/components/MessageLine.vue";
import Emojis from "@/chat/components/Emojis.vue";

import { ref, watch } from "vue";
import _ from "lodash";


export default {
  name: "ChatPanel",
  components: { MessageLine, Emojis },
  props: {
    user: {
      type: Object,
      required: true,
    },
    emittedMessage: {
      type: String,
      default: () => null,
    },
  },
  emits: ["close-chat"],
  setup(props) {
    const messageContent = ref("");
    const userMessages = ref([]);
    const chatContentRef = ref(null);
    const loading = ref(false);
    const emojiBtnClicked = ref(false);

    function handleSelectEmoji(emojiHtml) {
        sendMessage(props.user.id, emojiHtml);
        emojiBtnClicked.value = false;
    }

    function showEmojiList()
    {
        emojiBtnClicked.value = true;
    }

    function showLoading() {
      loading.value = true;
    }

    function hideLoading() {
      loading.value = false;
    }

    function submitMessage() {
        if (!messageContent.value) {
            return;
        }

        sendMessage(props.user.id, messageContent.value, () => {
            messageContent.value = "";
        });
    }

    function sendMessage(receiverId, messageContent, cb = null) {
        const payload = {
            receiver_id: receiverId,
            message_content: messageContent
        };

        window.axios.post("/messages", payload)
            .then(response => {
                if(response && response.data.status) {
                    // display and append the message in the message list
                    userMessages.value.push(response.data.message);

                    if(cb) {
                        cb();
                    }

                    // scroll bottom
                    scrollToChatBottom();
                }
            }).catch(error => {
            console.error(error.response);
        });
    }


    async function getMessages() {
      const res = await window.axios.get(
        `/messages?receiver_id=${props.user.id}`
      );
      if (res.data.messages) {
        userMessages.value = res.data.messages.reverse();
        scrollToChatBottom();
      }
    }
    let scrollPoint = ref(0);

    function scrollToChatBottom() {
      setTimeout(() => {
        if (chatContentRef && chatContentRef.value) {
          chatContentRef.value.scrollTop = chatContentRef.value.scrollHeight;

          scrollPoint.value = chatContentRef.value.scrollTop;
        }
      }, 300);
    }

    const handleChatScroll = _.debounce((e) => {
      if (e.target.scrollTop - 50 < scrollPoint.value) {
        showLoading();
        const oldMessage = userMessages.value[0];

        window.axios
          .get(
            `/messages?receiver_id=${props.user.id}&earlier_date=${oldMessage.created_at}`
          )
          .then((response) => {
            if (response && response.data.messages) {
              const filtered = [];

              response.data.messages.reverse().forEach((message) => {
                if (!userMessages.value.find((m) => m.id == message.id)) {
                  filtered.push(message);
                }
              });

              userMessages.value = [...filtered, ...userMessages.value];
            }

            setTimeout(() => {
              hideLoading();
            }, 2000);
          })
          .catch((error) => {
            setTimeout(() => {
              hideLoading();
            }, 2000);

            console.error(error.response);
          });
      }
      scrollPoint.value = e.target.scrollTop;
    }, 1000);

    getMessages();

    watch(
      () => props.emittedMessage,
      (newMessage, oldMessage) => {
        if (newMessage) {
          const isMessageExisted = userMessages.value.find(
            (msg) => msg.id === newMessage.id
          );
          if (!isMessageExisted) {
            userMessages.value.push(newMessage);
            scrollToChatBottom();
          }
        }
      }
    );

    return {
      messageContent,
      submitMessage,
      userMessages,
      chatContentRef,
      handleChatScroll,
      loading,
      emojiBtnClicked,
      showEmojiList,
      handleSelectEmoji
    };
  },
};
</script>

<style scoped>
</style>