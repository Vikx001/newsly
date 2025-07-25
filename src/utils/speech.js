// Create a speech utility for better control
export class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.currentUtterance = null
    this.isSupported = 'speechSynthesis' in window
  }

  speak(text, options = {}) {
    if (!this.isSupported) {
      throw new Error('Speech synthesis not supported')
    }

    // Cancel any ongoing speech
    this.stop()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply options
    utterance.rate = options.rate || 0.9
    utterance.pitch = options.pitch || 1
    utterance.volume = options.volume || 1
    utterance.voice = options.voice || null

    // Set up event handlers
    if (options.onStart) utterance.onstart = options.onStart
    if (options.onEnd) utterance.onend = options.onEnd
    if (options.onError) utterance.onerror = options.onError

    this.currentUtterance = utterance
    this.synthesis.speak(utterance)
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  pause() {
    if (this.synthesis) {
      this.synthesis.pause()
    }
  }

  resume() {
    if (this.synthesis) {
      this.synthesis.resume()
    }
  }

  get isPlaying() {
    return this.synthesis?.speaking || false
  }

  get isPaused() {
    return this.synthesis?.paused || false
  }

  getVoices() {
    return this.synthesis?.getVoices() || []
  }
}

export const speechManager = new SpeechManager()