<template>
  <Teleport to="body">
    <div v-if="isOpen" class="edit-modal-overlay" @click="handleOverlayClick">
      <div class="edit-modal" :class="{ 'mobile': isMobile }" @click.stop>
        <div class="edit-modal-header">
          <h3>Edit {{ title }}</h3>
          <button class="close-btn" @click="close">×</button>
        </div>
        <div class="edit-modal-body">
          <textarea
            ref="textareaRef"
            v-model="editText"
            :placeholder="`Edit ${title} text...`"
            class="edit-textarea"
            :style="{ fontSize: `${fontSize}px`, fontFamily: fontFamily }"
          ></textarea>
        </div>
        <div class="edit-modal-footer">
          <button class="cancel-btn" @click="close">Cancel</button>
          <button class="save-btn" @click="save">Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  fontSize: {
    type: Number,
    default: 15
  },
  fontFamily: {
    type: String,
    default: "'Noto Sans SC', sans-serif"
  }
})

const emit = defineEmits(['close', 'save'])

const editText = ref(props.content)
const textareaRef = ref(null)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleOverlayClick = () => {
  close()
}

const close = () => {
  emit('close')
}

const save = () => {
  emit('save', editText.value)
  close()
}

// Handle escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Auto-focus textarea when opened
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    editText.value = props.content
    await nextTick()
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.select()
    }
  }
})

// Update editText when content prop changes
watch(() => props.content, (newVal) => {
  if (props.isOpen) {
    editText.value = newVal
  }
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.edit-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(139, 92, 246, 0.08);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.edit-modal {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  width: 90%;
  max-width: 700px;
  height: 80vh;
  max-height: 650px;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.15);
}

.edit-modal.mobile {
  width: 95%;
  height: 85vh;
  max-height: none;
  border-radius: 20px;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.edit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.08);
  flex-shrink: 0;
}

.edit-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
  font-size: 24px;
  cursor: pointer;
  color: #6B21A5;
  transition: all 0.3s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  background: rgba(139, 92, 246, 0.08);
  border-color: rgba(139, 92, 246, 0.2);
  color: #7C3AED;
}

.edit-modal-body {
  flex: 1;
  padding: 20px 24px;
  overflow: hidden;
  min-height: 0;
}

.edit-textarea {
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: 16px;
  border: 2px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  font-family: inherit;
  line-height: 1.8;
  resize: none;
  outline: none;
  transition: all 0.3s;
  background: rgba(255, 255, 255, 0.6);
  color: #1a1a1a;
}

.edit-textarea:focus {
  border-color: #8B5CF6;
  background: white;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.06);
}

.edit-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(139, 92, 246, 0.08);
  flex-shrink: 0;
}

.cancel-btn,
.save-btn {
  padding: 10px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-size: 14px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
  color: #6B21A5;
}

.cancel-btn:hover {
  background: rgba(139, 92, 246, 0.05);
  border-color: rgba(139, 92, 246, 0.2);
}

.save-btn {
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

@media (max-width: 768px) {
  .edit-modal-header {
    padding: 12px 16px;
  }
  
  .edit-modal-body {
    padding: 12px 16px;
  }
  
  .edit-modal-footer {
    padding: 12px 16px;
    flex-direction: column-reverse;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>