import { ref, watch } from 'vue'

const STORAGE_KEY = 'littleKorean_settings'

export function useSettings() {
  // Load saved settings or use defaults
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        
        // Migrate from old Chinese settings if needed
        const migrated = {
          fontSize: parsed.fontSize ?? 14,
          selectedFont: parsed.selectedFont ?? 'NotoSansSC',
          // Migrate old Chinese setting names to Korean
          showRomanization: parsed.showRomanization ?? parsed.showPinyin ?? true,
          showKorean: parsed.showKorean ?? parsed.showChinese ?? true,
          showEnglish: parsed.showEnglish ?? true,
          // Migrate display order
          displayOrder: parsed.displayOrder === 'en-cn' ? 'en-kr' : 
                       parsed.displayOrder === 'cn-en' ? 'kr-en' : 
                       parsed.displayOrder ?? 'kr-en',
          interleaveLines: parsed.interleaveLines ?? false,
          // Migrate old percentage values to absolute pixel values
          romanizationFontSize: typeof parsed.romanizationFontSize === 'number' && parsed.romanizationFontSize < 1 
            ? Math.round(parsed.romanizationFontSize * (parsed.fontSize || 14)) 
            : parsed.romanizationFontSize ?? 8,
          englishFontSize: typeof parsed.englishFontSize === 'number' && parsed.englishFontSize < 1
            ? Math.round(parsed.englishFontSize * (parsed.fontSize || 14))
            : parsed.englishFontSize ?? 12
        }
        
        return migrated
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    return null
  }

  const saveSettings = (settings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  // Default settings - Korean optimized with absolute pixel values
  const defaultSettings = {
    fontSize: 14,
    selectedFont: 'NotoSansSC',
    showRomanization: true,
    showKorean: true,
    showEnglish: true,
    displayOrder: 'kr-en',
    interleaveLines: false,
    romanizationFontSize: 8, // Absolute pixel value
    englishFontSize: 12 // Absolute pixel value
  }

  const savedSettings = loadSettings()
  
  // Create reactive settings with saved values or defaults
  const fontSize = ref(savedSettings?.fontSize ?? defaultSettings.fontSize)
  const selectedFont = ref(savedSettings?.selectedFont ?? defaultSettings.selectedFont)
  const showRomanization = ref(savedSettings?.showRomanization ?? defaultSettings.showRomanization)
  const showKorean = ref(savedSettings?.showKorean ?? defaultSettings.showKorean)
  const showEnglish = ref(savedSettings?.showEnglish ?? defaultSettings.showEnglish)
  const displayOrder = ref(savedSettings?.displayOrder ?? defaultSettings.displayOrder)
  const interleaveLines = ref(savedSettings?.interleaveLines ?? defaultSettings.interleaveLines)
  const romanizationFontSize = ref(savedSettings?.romanizationFontSize ?? defaultSettings.romanizationFontSize)
  const englishFontSize = ref(savedSettings?.englishFontSize ?? defaultSettings.englishFontSize)

  // Save settings whenever any setting changes
  const saveCurrentSettings = () => {
    saveSettings({
      fontSize: fontSize.value,
      selectedFont: selectedFont.value,
      showRomanization: showRomanization.value,
      showKorean: showKorean.value,
      showEnglish: showEnglish.value,
      displayOrder: displayOrder.value,
      interleaveLines: interleaveLines.value,
      romanizationFontSize: romanizationFontSize.value,
      englishFontSize: englishFontSize.value
    })
  }

  // Watch all settings and save on change
  watch([fontSize, selectedFont, showRomanization, showKorean, showEnglish, displayOrder, interleaveLines, romanizationFontSize, englishFontSize], () => {
    saveCurrentSettings()
  }, { deep: true })

  // Reset to defaults
  const resetSettings = () => {
    fontSize.value = defaultSettings.fontSize
    selectedFont.value = defaultSettings.selectedFont
    showRomanization.value = defaultSettings.showRomanization
    showKorean.value = defaultSettings.showKorean
    showEnglish.value = defaultSettings.showEnglish
    displayOrder.value = defaultSettings.displayOrder
    interleaveLines.value = defaultSettings.interleaveLines
    romanizationFontSize.value = defaultSettings.romanizationFontSize
    englishFontSize.value = defaultSettings.englishFontSize
  }

  return {
    fontSize,
    selectedFont,
    showRomanization,
    showKorean,
    showEnglish,
    displayOrder,
    interleaveLines,
    romanizationFontSize,
    englishFontSize,
    resetSettings,
    saveCurrentSettings
  }
}