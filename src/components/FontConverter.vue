<template>
  <div class="converter-wrapper">
    <!-- Header with Logo and Settings -->
    <div class="app-header">
      <div class="logo-section">
        <h1 class="logo">LittleKorean</h1>
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
          <!-- Old rendering method (paragraph by paragraph) -->
          <template v-if="!interleaveLines">
            <div v-for="(block, sentenceId) in comparisonData" :key="sentenceId" class="comparison-block relative">
              
              <!-- Render based on display order and visibility toggles -->
              <template v-if="displayOrder === 'en-kr'">
                <!-- English first, then Korean -->
                <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box">
                  <div class="english-text" :style="{ fontSize: `${fontSize * 0.8}px`, lineHeight: '1.1' }">
                    {{ englishSegments[sentenceId] }}
                  </div>
                </div>

                <div v-if="showKorean" class="line-container">
                  <div class="text-line relative">
                    <div class="line-words-and-romanization" :style="{ fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
                      <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                        <span class="word" :style="{fontWeight: '600'}">
                          {{ wordData.korean }}
                        </span>
                        <span class="romanization" :style="{fontSize: `${fontSize * 0.7}px`, display: showRomanization ? 'inline' : 'none'}">
                          {{ wordData.romanized }}
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
                    <div class="line-words-and-romanization" :style="{ fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
                      <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                        <span class="word" :style="{fontWeight: '600'}">
                          {{ wordData.korean }}
                        </span>
                        <span class="romanization" :style="{fontSize: `${fontSize * 0.7}px`, display: showRomanization ? 'inline' : 'none'}">
                          {{ wordData.romanized }}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box">
                  <div class="english-text" :style="{ fontSize: `${fontSize * 0.8}px`, lineHeight: '1.1' }">
                    {{ englishSegments[sentenceId] }}
                  </div>
                </div>
              </template>

            </div>
          </template>

          <!-- New interleaved rendering method -->
          <template v-else>
            <div v-if="interleavedDisplayData && interleavedDisplayData.length" class="interleaved-container">
              <div v-for="(block, blockIndex) in interleavedDisplayData" :key="blockIndex" class="interleaved-block">
                <div v-for="(line, lineIndex) in block" :key="lineIndex" 
                     :class="['interleaved-line', line.type]"
                     :style="{
                       fontSize: line.type === 'korean' ? `${fontSize}px` : `${fontSize * 0.8}px`,
                       fontFamily: line.type === 'korean' ? getFontFamily : '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif'
                     }">
                  <span v-if="line.type === 'korean'" v-html="line.content"></span>
                  <span v-else>{{ line.content }}</span>
                </div>
              </div>
            </div>
          </template>

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
import { ref, computed, watch, nextTick } from 'vue';
import { romanize } from 'koroman'; // Using KOROMAN library
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
      interleaveLines,
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
    const containerWidth = ref(800);
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

    const loadArticleIntoEditor = (article) => {
      inputText.value = article.koreanContent || article.chineseContent || ''
      englishText.value = article.englishContent || ''
      cancelAutoSave()
      resetCurrentTracking()
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
      interleaveLines: interleaveLines.value
    }))

    // Update container width on resize
    const updateContainerWidth = () => {
      const container = document.querySelector('.comparison-display')
      if (container) {
        containerWidth.value = container.clientWidth - 32
      }
    }

    // Split text into lines based on container width
    const splitTextIntoLines = (text, width, fontSz, fontFamily, isKorean = true) => {
      if (!text || !width || width <= 0) return [text]
      
      const measureDiv = document.createElement('div')
      measureDiv.style.position = 'absolute'
      measureDiv.style.visibility = 'hidden'
      measureDiv.style.top = '-9999px'
      measureDiv.style.left = '-9999px'
      measureDiv.style.width = `${width}px`
      measureDiv.style.fontSize = `${fontSz}px`
      measureDiv.style.fontFamily = fontFamily
      measureDiv.style.lineHeight = '1.5'
      measureDiv.style.whiteSpace = 'pre-wrap'
      measureDiv.style.wordWrap = 'break-word'
      measureDiv.style.wordBreak = 'break-word'
      measureDiv.style.padding = '0'
      measureDiv.style.margin = '0'
      document.body.appendChild(measureDiv)
      
      const lines = []
      let currentLine = ''
      
      // Split by spaces for both Korean and English
      const words = text.split(/\s+/).filter(w => w)
      
      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word
        measureDiv.textContent = testLine
        
        if (measureDiv.scrollHeight > 30) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim())
          }
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      
      if (currentLine.trim()) {
        lines.push(currentLine.trim())
      }
      
      document.body.removeChild(measureDiv)
      return lines
    }

    // Get Korean text with romanization as HTML
    const getKoreanWithRomanizationHTML = (koreanText) => {
      if (!koreanText) return ''
      if (!showRomanization.value) return koreanText
      
      const words = getWordsWithRomanization(koreanText)
      return words.map(wordData => {
        if (wordData.romanized) {
          return `<span class="korean-with-romanization">${wordData.korean}<span class="inline-romanization">${wordData.romanized}</span></span>`
        }
        return wordData.korean
      }).join(' ')
    }

    // Get Korean text as plain string with romanization
    const getKoreanWithRomanizationText = (koreanText) => {
      if (!koreanText) return ''
      if (!showRomanization.value) return koreanText
      
      const words = getWordsWithRomanization(koreanText)
      return words.map(wordData => wordData.korean + (wordData.romanized ? ' ' + wordData.romanized : '')).join(' ')
    }

    // Core function: split Korean text into words with romanization using KOROMAN
    const getWordsWithRomanization = (text) => {
      if (!text) return []
      
      // Split by spaces and punctuation while keeping them
      const tokens = text.split(/(\s+|[.,!?;:()"'])/g).filter(t => t.trim() || t === ' ')
      
      const result = []
      let currentWord = ''
      
      for (const token of tokens) {
        if (token.trim() === '') {
          // If it's whitespace
          if (currentWord) {
            // Romanize using KOROMAN with pronunciation rules
            const romanized = romanize(currentWord, { 
              usePronunciationRules: true,
              casingOption: 'lowercase'
            })
            result.push({
              korean: currentWord,
              romanized: romanized
            })
            currentWord = ''
          }
          result.push({
            korean: token,
            romanized: ''
          })
        } else if (/[\uAC00-\uD7AF]/.test(token)) {
          // Korean characters - accumulate into words
          if (currentWord) {
            const romanized = romanize(currentWord, { 
              usePronunciationRules: true,
              casingOption: 'lowercase'
            })
            result.push({
              korean: currentWord,
              romanized: romanized
            })
            currentWord = ''
          }
          result.push({
            korean: token,
            romanized: romanize(token, { 
              usePronunciationRules: true,
              casingOption: 'lowercase'
            })
          })
        } else if (/[.,!?;:()"']/.test(token)) {
          // Punctuation
          if (currentWord) {
            const romanized = romanize(currentWord, { 
              usePronunciationRules: true,
              casingOption: 'lowercase'
            })
            result.push({
              korean: currentWord,
              romanized: romanized
            })
            currentWord = ''
          }
          result.push({
            korean: token,
            romanized: ''
          })
        } else {
          // Non-Korean characters (numbers, English, etc.)
          currentWord += token
        }
      }
      
      if (currentWord) {
        const romanized = romanize(currentWord, { 
          usePronunciationRules: true,
          casingOption: 'lowercase'
        })
        result.push({
          korean: currentWord,
          romanized: romanized
        })
      }
      
      return result
    }

    // Interleaved display data
    const interleavedDisplayData = computed(() => {
      if (!interleaveLines.value || !inputText.value.trim()) return null
      
      const koreanParagraphs = inputText.value.split(/\n\n/).filter(p => p.trim())
      const englishParagraphs = englishText.value.split(/\n\n/).filter(p => p.trim())
      
      nextTick(() => updateContainerWidth())
      
      const interleavedBlocks = []
      
      for (let i = 0; i < koreanParagraphs.length; i++) {
        const koreanPara = koreanParagraphs[i]
        const englishPara = englishParagraphs[i] || ''
        
        if (!showKorean.value && !showEnglish.value) continue
        
        // Get Korean text with romanization
        const koreanText = getKoreanWithRomanizationText(koreanPara)
        
        let koreanLines = []
        let englishLines = []
        
        if (showKorean.value && koreanText) {
          koreanLines = splitTextIntoLines(
            koreanText, 
            containerWidth.value, 
            fontSize.value, 
            getFontFamily.value,
            true
          )
        }
        
        if (showEnglish.value && englishPara) {
          englishLines = splitTextIntoLines(
            englishPara,
            containerWidth.value,
            fontSize.value * 0.8,
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            false
          )
        }
        
        const interleaved = []
        const maxLines = Math.max(koreanLines.length, englishLines.length)
        
        if (displayOrder.value === 'en-kr') {
          // English first
          for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
            if (lineIndex < englishLines.length && showEnglish.value) {
              interleaved.push({
                type: 'english',
                content: englishLines[lineIndex]
              })
            }
            if (lineIndex < koreanLines.length && showKorean.value) {
              interleaved.push({
                type: 'korean',
                content: koreanLines[lineIndex]
              })
            }
          }
        } else {
          // Korean first
          for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
            if (lineIndex < koreanLines.length && showKorean.value) {
              interleaved.push({
                type: 'korean',
                content: koreanLines[lineIndex]
              })
            }
            if (lineIndex < englishLines.length && showEnglish.value) {
              interleaved.push({
                type: 'english',
                content: englishLines[lineIndex]
              })
            }
          }
        }
        
        if (interleaved.length) {
          interleavedBlocks.push(interleaved)
        }
      }
      
      return interleavedBlocks
    })

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
      interleaveLines.value = newSettings.interleaveLines
      closeSettingsModal()
      nextTick(() => updateContainerWidth())
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

    // Watch for window resize
    watch([interleaveLines, inputText, englishText, fontSize, showRomanization], () => {
      if (interleaveLines.value) {
        nextTick(() => updateContainerWidth())
      }
    })

    // Set up resize observer
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (interleaveLines.value) {
          updateContainerWidth()
        }
      })
    }

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
      interleaveLines,

      isLoading,
      loadingText,
      
      // Computed
      getFontFamily,
      comparisonData,
      englishSegments,
      settings,
      interleavedDisplayData,
      
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
/* Keep all existing styles, but update class names */
.app-header {
  position: sticky;
  top: 0;
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #4a6cf7 0%, #6c5ce7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
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
  color: #495057;
}

.settings-icon-btn:hover {
  background: #f8f9fa;
  transform: rotate(90deg);
}

.main-content {
  display: block;
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
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.text-input:focus {
  outline: none;
  border-color: #4a6cf7;
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.action-btn {
  padding: 8px 20px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f8f9fa;
  border-color: #4a6cf7;
  color: #4a6cf7;
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6c757d;
  z-index: 10;
}

.edit-btn:hover {
  background: #4a6cf7;
  border-color: #4a6cf7;
  color: white;
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
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

/* Updated styles for Korean word-based romanization */
.line-words-and-romanization {
  text-wrap: wrap;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.8;
  gap: 4px;
}

.word-group {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin-right: 4px;
  white-space: normal;
}

.word {
  display: inline;
  font-weight: 600;
  color: #1a1a1a;
}

.romanization {
  display: inline;
  font-size: 0.7em;
  color: #9ca3af;
  font-weight: 400;
  letter-spacing: 0.3px;
  white-space: normal;
  transition: color 0.2s ease;
  margin-left: 2px;
}

.romanization:hover {
  color: #6b7280;
}

.english-translation-box {
  background-color: rgba(255, 255, 255, 0.3);
  margin-bottom: 8px;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

.english-text {
  color: #2c3e50;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.english-input {
  border-color: #5dade2 !important;
  outline-color: #5dade2 !important;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #868e96;
  font-style: italic;
}

.relative {
  position: relative;
}

.converter-wrapper {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  word-break: break-word;
}

.text-line {
  display: block;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Interleaved mode styles */
.interleaved-container {
  width: 100%;
}

.interleaved-block {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.interleaved-line {
  padding: 6px 0;
  line-height: 1.5;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}

.interleaved-line.korean {
  font-weight: 500;
  color: #1a1a1a;
}

.interleaved-line.english {
  color: #4a6cf7;
}

/* Inline romanization styling for interleaved mode */
.korean-with-romanization {
  display: inline-block;
  margin-right: 4px;
}

.inline-romanization {
  font-size: 0.65em;
  color: #9ca3af;
  margin-left: 1px;
  font-weight: 400;
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
  
  .word {
    font-size: 0.95em;
  }
  
  .romanization {
    font-size: 0.55em;
    margin-left: 1px;
  }
  
  .line-words-and-romanization {
    gap: 2px;
    line-height: 1.6;
  }
  
  .interleaved-block {
    padding: 12px;
  }
  
  .interleaved-line.english {
    padding-left: 8px;
  }
}

/* For very small screens */
@media (max-width: 480px) {
  .word {
    font-size: 0.9em;
  }
  
  .romanization {
    font-size: 0.5em;
  }
  
  .line-container {
    padding: 8px;
  }
  
  .english-text {
    font-size: 0.9em;
  }
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
  color: #495057;
}

.history-icon-btn:hover {
  background: #f8f9fa;
  transform: scale(1.05);
}
</style>