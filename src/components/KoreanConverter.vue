<template>
  <div class="converter-wrapper">
    <!-- Header with Logo and Settings -->
    <div class="app-header">
      <div class="logo-section">
        <h1 class="logo">LittleHanzi 한국인</h1>
      </div>
      <div class="header-buttons">
        <button class="history-icon-btn" @click="openHistoryModal" title="Reading History">
          <BookOpen :size="22" />
        </button>
        <button class="settings-icon-btn" @click="openSettingsModal" title="Settings">
          <Settings :size="24" />
        </button>
      </div>
    </div>

    <!-- History Modal -->
    <ArticleHistoryModal
      :isOpen="isHistoryModalOpen"
      :articles="articles"
      :isCurrentArticle="isCurrentArticle"
      :formatDate="formatDate"
      @close="closeHistoryModal"
      @load-article="loadArticleIntoEditor"
      @delete-article="handleDeleteArticle"
      @delete-all="handleDeleteAllArticles"
    />

    <div class="main-content">
      <LoadingSpinner :isLoading="isLoading" :text="loadingText" />
      
      <div class="input-display-row">
        <!-- Korean Text Input -->
        <div class="text-section" :style="{fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea 
              v-model="inputText" 
              placeholder="Enter Korean text here..." 
              class="text-input w-full" 
            ></textarea>
            <button 
              v-if="inputText.trim()" 
              @click="openEditModal('korean')" 
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText('korean')" class="action-btn">
            {{ inputText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>

        <!-- English Translation Input -->
        <div class="text-section" :style="{fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea 
              v-model="englishText" 
              placeholder="Enter English translation here..." 
              class="text-input w-full english-input" 
            ></textarea>
            <button 
              v-if="englishText.trim()" 
              @click="openEditModal('english')" 
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText('english')" class="action-btn">
            {{ englishText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>
      </div>

      <!-- Edit Modal -->
      <EditModal
        :isOpen="isEditModalOpen"
        :title="editModalTitle"
        :content="editModalContent"
        :fontSize="Number(fontSize)"
        :fontFamily="getFontFamily"
        @close="closeEditModal"
        @save="saveEditModalContent"
      />

      <!-- Settings Modal -->
      <SettingsModal
        :isOpen="isSettingsModalOpen"
        :settings="settings"
        @close="closeSettingsModal"
        @save="saveSettings"
        @reset="resetToDefaults"
      />

      <div v-if="inputText.trim() && (showEnglish || showKorean)" class="comparison-section">
        <div class="comparison-display relative">
          <!-- Render based on display order and visibility toggles -->
          <div v-for="(block, sentenceId) in comparisonData" :key="sentenceId" class="comparison-block relative">
            
            <template v-if="displayOrder === 'en-kr'">
              <!-- English first, then Korean -->
              <!-- <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box"> -->
                <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box" :style="{ fontFamily: getFontFamily }">
                  <div class="english-text" :style="{ 
                    fontSize: `${englishFontSize}px`, 
                    lineHeight: '1' 
                  }">
                    {{ englishSegments[sentenceId] }}
                  </div>
              </div>

              <div v-if="showKorean" class="line-container">
                <div class="text-line relative">
                  <div class="line-words" :style="{ fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
                    <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                      <span class="word-with-romanization">
                        <span class="romanization-above" :style="{ display: showRomanization ? 'flex' : 'none' }">
                          <span 
                            v-for="(char, charIndex) in wordData.romanizedChars" 
                            :key="charIndex"
                            class="romanization-char"
                            :style="{ 
                              fontSize: `${romanizationFontSize}px`,
                              minWidth: `${romanizationFontSize * 0.6}px`,
                              textAlign: 'center'
                            }"
                          >
                            {{ char }}
                          </span>
                        </span>
                        <span class="word" :style="{fontWeight: '400'}">
                          <span v-for="(char, charIndex) in wordData.koreanChars" :key="charIndex" class="korean-char">
                            {{ char }}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <!-- Korean first, then English -->
              <div v-if="showKorean" class="line-container">
                <div class="text-line relative">
                  <div class="line-words" :style="{ fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
                    <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                      <span class="word-with-romanization">
                        <span class="romanization-above" :style="{ display: showRomanization ? 'flex' : 'none' }">
                          <span 
                            v-for="(char, charIndex) in wordData.romanizedChars" 
                            :key="charIndex"
                            class="romanization-char"
                            :style="{ 
                              fontSize: `${romanizationFontSize}px`,
                              minWidth: `${romanizationFontSize * 0.6}px`,
                              textAlign: 'center'
                            }"
                          >
                            {{ char }}
                          </span>
                        </span>
                        <span class="word" :style="{fontWeight: '400'}">
                          <span v-for="(char, charIndex) in wordData.koreanChars" :key="charIndex" class="korean-char">
                            {{ char }}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box" :style="{ fontFamily: getFontFamily }">
                <div class="english-text" :style="{ 
                  fontSize: `${englishFontSize}px`, 
                  lineHeight: '1.1' 
                }">
                  {{ englishSegments[sentenceId] }}
                </div>
              </div>
            </template>

          </div>

          <div v-if="inputText.trim()" class="quick-actions">
            <button @click="requestClearAll" class="clear-all-btn">
              Clear All Text
            </button>
          </div>

          <div 
            class="scroll-spacer"
            :style="{
              minHeight: `calc(66vh - ${fontSize * 2}px)`
            }"
          ></div>
        </div>
      </div>

      <!-- Empty state when both English and Korean are hidden -->
      <div v-else-if="inputText.trim() && !showEnglish && !showKorean" class="empty-state">
        <p>Both English and Korean paragraphs are hidden. Enable them in settings.</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Clear All Text"
      message="Are you sure you want to clear all Korean and English text? This action cannot be undone."
      confirmText="Yes, Clear All"
      cancelText="Cancel"
      @confirm="confirmClearAll"
      @cancel="cancelClearAll"
    />
  </div>
</template>

<script>
import ArticleHistoryModal from './ArticleHistoryModal.vue';
import { useArticleHistory } from '../composables/useArticleHistory';
import { Edit as EditIcon, Settings, BookOpen } from 'lucide-vue-next';
import EditModal from './EditModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import SettingsModal from './SettingsModal.vue';
import { ref, computed, watch } from 'vue';
import { romanize } from 'koroman';
import LoadingSpinner from './LoadingSpinner.vue';
import { useSettings } from '../composables/useSettings';

export default {
  components: {
    ArticleHistoryModal,
    EditModal,
    ConfirmModal,
    SettingsModal,
    LoadingSpinner,
    BookOpen,
    EditIcon,
    Settings,
  },
  name: 'KoreanConverter',
  setup() {
    const {
      fontSize,
      selectedFont,
      showRomanization,
      showKorean,
      showEnglish,
      displayOrder,
      romanizationFontSize,
      englishFontSize,
      resetSettings
    } = useSettings()

    const {
      articles,
      scheduleAutoSave,
      cancelAutoSave,
      saveCurrentArticle,
      deleteArticle,
      deleteAllArticles,
      loadArticle,
      isCurrentArticle,
      formatDate,
      resetCurrentTracking
    } = useArticleHistory()
    
    const inputText = ref('');
    const englishText = ref('');
    const showConfirmModal = ref(false);
    const isSettingsModalOpen = ref(false);
    const isLoading = ref(false);
    const loadingText = ref('Processing...');

    const isEditModalOpen = ref(false)
    const editModalType = ref('korean')
    const editModalTitle = computed(() => editModalType.value === 'korean' ? 'Korean Text' : 'English Translation')
    const editModalContent = computed(() => editModalType.value === 'korean' ? inputText.value : englishText.value)

    const isHistoryModalOpen = ref(false)
    const lastSavedContent = ref({ korean: '', english: '' })

    // Watchers for auto-save
    watch([inputText, englishText], ([newKorean, newEnglish]) => {
      if (newKorean && newKorean.trim()) {
        scheduleAutoSave(newKorean, newEnglish)
        lastSavedContent.value = { korean: newKorean, english: newEnglish }
      } else {
        cancelAutoSave()
        resetCurrentTracking()
      }
    }, { deep: true })

    // Modal methods
    const openHistoryModal = () => {
      isHistoryModalOpen.value = true
    }

    const closeHistoryModal = () => {
      isHistoryModalOpen.value = false
    }

    const loadArticleIntoEditor = async (article) => {
      isLoading.value = true
      loadingText.value = 'Loading article...'
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      inputText.value = article.koreanContent || article.chineseContent || ''
      englishText.value = article.englishContent || ''
      cancelAutoSave()
      resetCurrentTracking()
      
      isLoading.value = false
    }

    const handleDeleteArticle = (articleId) => {
      deleteArticle(articleId)
    }

    const handleDeleteAllArticles = () => {
      deleteAllArticles()
    }

    // Settings object for modal
    const settings = computed(() => ({
      fontSize: Number(fontSize.value),
      selectedFont: selectedFont.value,
      showRomanization: showRomanization.value,
      showEnglish: showEnglish.value,
      showKorean: showKorean.value,
      displayOrder: displayOrder.value,
      romanizationFontSize: romanizationFontSize.value,
      englishFontSize: englishFontSize.value
    }))

    // Core function: split Korean text into words with per-character romanization
    const getWordsWithRomanization = (text) => {
      if (!text) return []
      
      const tokens = text.split(/(\s+|[.,!?;:()"'])/g).filter(t => t.trim() || t === ' ')
      
      const result = []
      let currentWord = ''
      
      for (const token of tokens) {
        if (token.trim() === '') {
          if (currentWord) {
            result.push(processWord(currentWord))
            currentWord = ''
          }
          result.push({
            korean: token,
            koreanChars: [],
            romanized: '',
            romanizedChars: []
          })
        } else if (/[\uAC00-\uD7AF]/.test(token)) {
          if (currentWord) {
            result.push(processWord(currentWord))
            currentWord = ''
          }
          result.push(processWord(token))
        } else if (/[.,!?;:()"']/.test(token)) {
          if (currentWord) {
            result.push(processWord(currentWord))
            currentWord = ''
          }
          result.push({
            korean: token,
            koreanChars: [],
            romanized: '',
            romanizedChars: []
          })
        } else {
          currentWord += token
        }
      }
      
      if (currentWord) {
        result.push(processWord(currentWord))
      }
      
      return result
    }

    // Process a single word into characters with romanization
    const processWord = (word) => {
      const koreanChars = [...word]
      const romanized = romanize(word, { 
        usePronunciationRules: true,
        casingOption: 'lowercase'
      })
      
      const romanizedChars = []
      for (let i = 0; i < koreanChars.length; i++) {
        const char = koreanChars[i]
        const charRomanized = romanize(char, { 
          usePronunciationRules: true,
          casingOption: 'lowercase'
        })
        romanizedChars.push(charRomanized || '')
      }
      
      return {
        korean: word,
        koreanChars: koreanChars,
        romanized: romanized,
        romanizedChars: romanizedChars
      }
    }

    const openSettingsModal = () => {
      isSettingsModalOpen.value = true
    }

    const requestClearAll = () => {
      if (inputText.value.trim() || englishText.value.trim()) {
        showConfirmModal.value = true
      }
    }

    const confirmClearAll = () => {
      clearText('both')
      showConfirmModal.value = false
    }

    const cancelClearAll = () => {
      showConfirmModal.value = false
    }

    const closeSettingsModal = () => {
      isSettingsModalOpen.value = false
    }

    const saveSettings = (newSettings) => {
      fontSize.value = newSettings.fontSize
      selectedFont.value = newSettings.selectedFont
      showRomanization.value = newSettings.showRomanization
      showEnglish.value = newSettings.showEnglish
      showKorean.value = newSettings.showKorean
      displayOrder.value = newSettings.displayOrder
      romanizationFontSize.value = newSettings.romanizationFontSize
      englishFontSize.value = newSettings.englishFontSize
      closeSettingsModal()
    }

    const resetToDefaults = () => {
      resetSettings()
      closeSettingsModal()
    }

    const openEditModal = (type) => {
      editModalType.value = type
      isEditModalOpen.value = true
    }

    const closeEditModal = () => {
      isEditModalOpen.value = false
    }

    const saveEditModalContent = (newContent) => {
      if (editModalType.value === 'korean') {
        inputText.value = newContent
      } else {
        englishText.value = newContent
      }
      closeEditModal()
    }

    // Font configurations
    const fonts = {
      NotoSansSC: "'Noto Sans SC', 'Inter', sans-serif",
      NotoSerifSC: "'Noto Serif SC', 'Georgia', serif",
      Inter: "'Inter', 'Noto Sans SC', sans-serif",
      Roboto: "'Roboto', 'Noto Sans SC', sans-serif",
      Poppins: "'Poppins', 'Noto Sans SC', sans-serif",
      ZCOOLKuaiLe: "'ZCOOL KuaiLe', cursive",
      MaShanZheng: "'Ma Shan Zheng', cursive",
    };

    const getFontFamily = computed(() => fonts[selectedFont.value]);

    const breakEnglishText = (englishText, koreanSegments) => {
      if (!englishText.trim()) return {};
      
      const normalizedText = englishText
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n(\s*\n)*/g, '\n\n');
      
      const englishParagraphs = normalizedText
        .split(/\n\n/)
        .map(para => para.trim())
        .filter(para => para);
      
      const result = {};
      const koreanSegmentKeys = koreanSegments ? Object.keys(koreanSegments) : [];
      
      englishParagraphs.forEach((paragraph, index) => {
        if (index < koreanSegmentKeys.length) {
          result[koreanSegmentKeys[index]] = paragraph;
        }
      });
      
      return result;
    };

    const englishSegments = computed(() => {
      return breakEnglishText(englishText.value, comparisonData.value);
    });

    const pasteFromClipboard = async (target = null) => {
      isLoading.value = true;
      loadingText.value = 'Pasting from clipboard...';
      
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const clipboardText = await navigator.clipboard.readText();
        const targetType = target || 'korean';
        
        loadingText.value = 'Processing text...';
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (targetType === 'korean') {
          inputText.value = clipboardText;
        } else {
          englishText.value = clipboardText;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to read clipboard contents: ', error);
        loadingText.value = 'Failed to paste. Try again.';
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        isLoading.value = false;
      }
    };

    const clearText = (type = 'both') => {
      if (type === 'korean' || type === 'both') {
        inputText.value = '';
      }
      
      if (type === 'english' || type === 'both') {
        englishText.value = '';
      }
      
      if (type === 'both' || (type === 'korean' && !inputText.value.trim())) {
        cancelAutoSave()
        resetCurrentTracking()
      }
    }

    const clearOrPasteText = (type) => {
      const text = type === 'korean' ? inputText.value : englishText.value;
      
      if (text.trim()) {
        clearText(type);
      } else {
        pasteFromClipboard(type);
      }
    };

    // Updated comparison data for Korean
    const comparisonData = computed(() => {
      if (!inputText.value) return {};
      
      const normalizedText = inputText.value
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n(\s*\n)*/g, '\n\n');
      
      const koreanParagraphs = normalizedText
        .split(/\n\n/)
        .map(para => para.trim())
        .filter(para => para);
      
      const result = {};
      
      koreanParagraphs.forEach((paragraph, index) => {
        const sentenceId = index;
        result[sentenceId] = {
          words: getWordsWithRomanization(paragraph)
        };
      });
      
      return result;
    });

    return {
      articles,
      isHistoryModalOpen,
      openHistoryModal,
      closeHistoryModal,
      loadArticleIntoEditor,
      handleDeleteArticle,
      handleDeleteAllArticles,
      isCurrentArticle,
      formatDate,

      // Data
      inputText,
      englishText,
      selectedFont,
      fontSize,
      showRomanization,
      showEnglish,
      showKorean,
      displayOrder,
      romanizationFontSize,
      englishFontSize,

      isLoading,
      loadingText,
      
      // Computed
      getFontFamily,
      comparisonData,
      englishSegments,
      settings,
      
      // Methods
      clearOrPasteText,
      clearAllText: clearText,
      
      // Modal related
      EditIcon,
      Settings,
      isEditModalOpen,
      editModalTitle,
      editModalContent,
      openEditModal,
      closeEditModal,
      saveEditModalContent,
      
      // Settings modal
      isSettingsModalOpen,
      openSettingsModal,
      closeSettingsModal,
      saveSettings,
      resetToDefaults,

      showConfirmModal,
      requestClearAll,
      confirmClearAll,
      cancelClearAll,
    };
  },
};
</script>

<style scoped>
/* App Header */
.app-header {
  position: sticky;
  top: 0;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-bottom: var(--border-primary-light);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  background: var(--gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.history-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
}

.history-icon-btn:hover {
  background: var(--p-100);
  transform: scale(1.05);
}

.settings-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
}

.settings-icon-btn:hover {
  background: var(--p-100);
  transform: rotate(90deg);
}

.main-content {
  display: block;
}

/* Main Background */
.converter-wrapper {
  width: 100%;
  min-height: 100vh;
  background: var(--gradient-main);
}

.input-display-row {
  margin: 20px auto;
  padding: 5px;
  display: block;
  width: 100%;
  max-width: 1200px;
}

.text-section {
  width: 100%;
  padding: 0 1rem;
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.text-input {
  width: 100%;
  min-height: 40px;
  padding: 12px;
  background: var(--bg-input);
  backdrop-filter: blur(10px);
  border: var(--border-primary-strong);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  color: var(--text);
}

.text-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.text-input::placeholder {
  color: var(--p-400);
  opacity: 0.5;
}

.english-input {
  width: 100%;
  min-height: 30px;
  padding: 8px;
  background: var(--bg-input);
  backdrop-filter: blur(10px);
  border: var(--border-primary-strong);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  color: var(--text);
}

.english-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.english-input::placeholder {
  color: var(--p-400);
  opacity: 0.5;
}

.action-btn {
  padding: 8px 20px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--bg-input);
  backdrop-filter: blur(10px);
  border: var(--border-primary);
  border-radius: var(--radius-sm);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
  z-index: 10;
}

.edit-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
  transform: scale(1.05);
}

.quick-actions {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 1rem;
  text-align: center;
}

.clear-all-btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--r-100);
  border: 1px solid var(--r-200);
  border-radius: var(--radius-sm);
  color: var(--r-600);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: var(--r-200);
  transform: translateY(-1px);
}

/* Korean word-based romanization - ABOVE the word */
.line-words {
  text-wrap: wrap;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.2;
  /* gap: 3px 3px; */
}

.word-group {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  white-space: normal;
}

.word-with-romanization {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.romanization-above {
  display: flex;
  gap: 0px;
  justify-content: center;
  margin-bottom: 2px;
  flex-wrap: nowrap;
}

.romanization-char {
  color: var(--primary);
  font-weight: 400;
  letter-spacing: 0.1px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: inline-block;
  opacity: 0.7;
}

.word {
  display: inline-flex;
  font-weight: 400;
  color: var(--text);
  gap: 0px;
}

.korean-char {
  display: inline-block;
}

.english-translation-box {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 8px;
  border: var(--border-secondary);
}

.english-text {
  color: var(--g-800);
  line-height: 1.6;
  font-family: inherit; /* Inherits from parent which has the selected font */
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--primary);
  font-style: italic;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
}

.relative {
  position: relative;
}

.comparison-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  overflow-x: hidden;
}

.comparison-display {
  max-width: 100%;
  width: 100%;
  overflow-x: hidden;
}

.comparison-block {
  margin-bottom: 24px;
  width: 100%;
  overflow-x: hidden;
}

.line-container {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  border: var(--border-primary-light);
  box-shadow: var(--shadow-primary);
  width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  word-break: break-word;
  transition: all 0.3s;
}

.line-container:hover {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-primary-hover);
  border-color: rgba(139, 92, 246, 0.15);
}

.text-line {
  display: block;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Mobile specific fixes */
@media (max-width: 768px) {
  .app-header {
    padding: 8px 16px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .input-display-row {
    margin: 10px auto;
  }
  
  .text-section {
    padding: 0 0.5rem;
  }
  
  .comparison-section {
    padding: 0 0.5rem;
  }
  
  .line-container {
    padding: 12px;
  }
  
  .line-words {
    gap: 4px 8px;
  }
  
  .romanization-char {
    font-size: 0.55em !important;
    min-width: 0.6em !important;
  }
}

/* For very small screens */
@media (max-width: 480px) {
  .line-words {
    gap: 2px 6px;
  }
  
  .romanization-char {
    font-size: 0.5em !important;
    min-width: 0.5em !important;
  }
  
  .line-container {
    padding: 8px;
  }
  
  .english-text {
    font-size: 0.9em;
  }
}
</style>
