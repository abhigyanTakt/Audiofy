document.addEventListener("DOMContentLoaded", () => {
  const voiceInputBtn = document.getElementById("voice-input-btn")
  const uploadBtn = document.getElementById("upload-btn")
  const audioUpload = document.getElementById("audio-upload")
  const recordingStatus = document.getElementById("recording-status")
  const fileInfo = document.getElementById("file-info")
  const fileName = document.getElementById("file-name")
  const transcriptionDisplay = document.getElementById("transcription-display")
  const savePdfBtn = document.getElementById("save-pdf-btn")
  const saveDocxBtn = document.getElementById("save-docx-btn")
  const downloadAllBtn = document.getElementById("download-all-btn")
  const languageSelect = document.getElementById("language")
  const summarizeBtn = document.getElementById("summarize-btn")

  const trainingUploadBtn = document.getElementById("training-upload-btn")
  const trainingAudio = document.getElementById("training-audio")
  const trainingFileName = document.getElementById("training-file-name")
  const trainingForm = document.getElementById("training-form")

  const feedbackText = document.getElementById("feedback-text")
  const submitFeedback = document.getElementById("submit-feedback")

  // Python modal elements
  const launchPythonBtn = document.getElementById("launch-python-btn")
  const pythonModal = document.getElementById("python-modal")
  const closeModalBtn = document.getElementById("close-modal")
  const closeSpan = document.querySelector(".close")
  const startRecognitionBtn = document.getElementById("start-recognition")
  const pythonStatus = document.getElementById("python-status")
  const pythonResult = document.getElementById("python-result")
  const originalText = document.getElementById("original-text")
  const translatedTextElement = document.getElementById("translated-text")
  const detectedLanguageBadge = document.getElementById("detected-language-badge")
  const playTranslationBtn = document.getElementById("play-translation")
  const savePdfPythonBtn = document.getElementById("save-pdf-python")
  const saveDocxPythonBtn = document.getElementById("save-docx-python")
  const downloadAllPythonBtn = document.getElementById("download-all-python")
  const srcLanguage = document.getElementById("src-language")
  const destLanguage = document.getElementById("dest-language")
  const textSummary = document.getElementById("text-summary")
  const detectedTone = document.getElementById("detected-tone")

  let isRecording = false
  let recognition = null
  let currentTranscription = ""
  let pythonRecognitionActive = false
  const recognitionResults = null
  let advancedRecognition = null

  // Audio context for spectrogram
  let audioContext = null
  let analyser = null
  let spectrogramCanvas = null
  let spectrogramCtx = null
  let spectrogramAnimationId = null
  let advancedSpectrogramAnimationId = null
  let audioStream = null

  // Improved speech recognition initialization
  function initSpeechRecognition() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser. Please try Chrome or Edge.")
      voiceInputBtn.disabled = true
      return
    }

    try {
      recognition = new window.SpeechRecognition()

      // Configure for better speech recognition
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = languageSelect.value

      recognition.onstart = () => {
        isRecording = true
        updateRecordingUI()
        console.log("Speech recognition started")
      }

      recognition.onresult = (event) => {
        // Get the final transcript
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Update current transcription with final results
        if (finalTranscript) {
          currentTranscription += finalTranscript + " "
        }

        // Update the display
        updateTranscriptionDisplay(currentTranscription, interimTranscript)
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)

        // Handle specific errors
        if (event.error === "no-speech") {
          alert("No speech was detected. Please try speaking louder or check your microphone.")
        } else if (event.error === "audio-capture") {
          alert("No microphone was found or microphone is disabled. Please check your microphone settings.")
        } else if (event.error === "not-allowed") {
          alert("Microphone permission was denied. Please allow microphone access to use speech recognition.")
        } else if (event.error === "network") {
          alert("Network error occurred. Please check your internet connection.")
        } else if (event.error === "aborted") {
          console.log("Speech recognition aborted")
        } else {
          alert("Speech recognition error: " + event.error)
        }

        stopRecording()
      }

      recognition.onend = () => {
        console.log("Speech recognition ended")

        // Restart if still recording
        if (isRecording) {
          console.log("Restarting speech recognition...")
          try {
            setTimeout(() => {
              recognition.start()
            }, 100)
          } catch (error) {
            console.error("Error restarting recognition:", error)
            stopRecording()
          }
        }
      }

      console.log("Speech recognition initialized successfully")
    } catch (error) {
      console.error("Error initializing speech recognition:", error)
      alert("Failed to initialize speech recognition. Please try using a different browser like Chrome or Edge.")
      voiceInputBtn.disabled = true
    }
  }

  // Initialize spectrogram
  function initSpectrogram() {
    // Create spectrogram container if it doesn't exist
    if (!document.getElementById("spectrogram-container")) {
      const transcriptionCard = document.querySelector(".transcription-card .card-body")

      const spectrogramContainer = document.createElement("div")
      spectrogramContainer.id = "spectrogram-container"
      spectrogramContainer.style.marginTop = "1rem"

      spectrogramCanvas = document.createElement("canvas")
      spectrogramCanvas.id = "spectrogram"
      spectrogramCanvas.width = transcriptionCard.clientWidth
      spectrogramCanvas.height = 150

      spectrogramContainer.appendChild(spectrogramCanvas)
      transcriptionCard.insertBefore(spectrogramContainer, transcriptionDisplay)

      spectrogramCtx = spectrogramCanvas.getContext("2d")
    } else {
      spectrogramCanvas = document.getElementById("spectrogram")
      spectrogramCtx = spectrogramCanvas.getContext("2d")
    }

    // Initialize Web Audio API
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048

      // Get microphone input
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const source = audioContext.createMediaStreamSource(stream)
          source.connect(analyser)

          // Start drawing spectrogram
          drawSpectrogram()
        })
        .catch((err) => {
          console.error("Error accessing microphone for spectrogram:", err)
        })
    } else {
      // Resume audio context if it was suspended
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Start drawing spectrogram
      drawSpectrogram()
    }
  }

  // Draw spectrogram
  function drawSpectrogram() {
    if (!analyser || !spectrogramCtx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    spectrogramCtx.clearRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height)

    function draw() {
      spectrogramAnimationId = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      spectrogramCtx.fillStyle = "rgb(0, 0, 0)"
      spectrogramCtx.fillRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height)

      const barWidth = (spectrogramCanvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        // Create gradient for visualization
        const gradient = spectrogramCtx.createLinearGradient(0, 0, 0, spectrogramCanvas.height)
        gradient.addColorStop(0, "rgb(255, 255, 0)") // Yellow
        gradient.addColorStop(0.5, "rgb(255, 215, 0)") // Gold
        gradient.addColorStop(1, "rgb(218, 165, 32)") // Golden Rod

        spectrogramCtx.fillStyle = gradient
        spectrogramCtx.fillRect(x, spectrogramCanvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  // Stop spectrogram
  function stopSpectrogram() {
    if (spectrogramAnimationId) {
      cancelAnimationFrame(spectrogramAnimationId)
      spectrogramAnimationId = null
    }

    // Clear the regular spectrogram
    if (spectrogramCanvas && spectrogramCtx) {
      spectrogramCtx.clearRect(0, 0, spectrogramCanvas.width, spectrogramCanvas.height)
    }

    // Clear the advanced spectrogram
    const advancedSpectrogramCanvas = document.getElementById("advanced-spectrogram")
    if (advancedSpectrogramCanvas) {
      const advancedSpectrogramCtx = advancedSpectrogramCanvas.getContext("2d")
      advancedSpectrogramCtx.clearRect(0, 0, advancedSpectrogramCanvas.width, advancedSpectrogramCanvas.height)
    }

    // Stop any active audio context
    if (audioContext && audioContext.state === "running") {
      audioContext.suspend()
    }

    // Stop any active media streams
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      audioStream = null
    }
  }

  // Update UI when recording state changes
  function updateRecordingUI() {
    if (isRecording) {
      voiceInputBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording'
      voiceInputBtn.classList.add("recording")
      recordingStatus.classList.remove("hidden")
      fileInfo.classList.add("hidden")
    } else {
      voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording'
      voiceInputBtn.classList.remove("recording")
      recordingStatus.classList.add("hidden")
    }
  }

  // Update transcription display
  function updateTranscriptionDisplay(final, interim = "") {
    if (final || interim) {
      transcriptionDisplay.innerHTML = `
          <p>${final}</p>
          <p class="interim">${interim}</p>
        `
    } else {
      transcriptionDisplay.innerHTML = '<p class="placeholder">Your transcription will appear here...</p>'
    }

    // Auto scroll to bottom
    transcriptionDisplay.scrollTop = transcriptionDisplay.scrollHeight
  }

  // Improved start recording function
  function startRecording() {
    // Check for microphone permission first
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Store the stream for later cleanup
        audioStream = stream

        // Reset transcription
        currentTranscription = ""
        updateTranscriptionDisplay("")

        // Show user feedback
        transcriptionDisplay.innerHTML = '<p class="placeholder">Listening... Please speak clearly.</p>'

        // Initialize spectrogram for visualization
        initSpectrogram()

        try {
          // Make sure recognition is properly initialized
          if (!recognition) {
            initSpeechRecognition()
          }

          // Add event listener for results if not already added
          if (!recognition.onresult) {
            recognition.onresult = (event) => {
              let interimTranscript = ""
              let finalTranscript = ""

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                  finalTranscript += transcript
                } else {
                  interimTranscript += transcript
                }
              }

              // Update current transcription with final results
              if (finalTranscript) {
                currentTranscription += finalTranscript + " "
              }

              // Update the display
              updateTranscriptionDisplay(currentTranscription, interimTranscript)
            }
          }

          recognition.start()
          console.log("Speech recognition started successfully")
        } catch (error) {
          console.error("Error starting recognition:", error)

          // Try to reinitialize recognition
          try {
            console.log("Attempting to reinitialize speech recognition...")
            recognition = null
            initSpeechRecognition()
            setTimeout(() => {
              recognition.start()
              console.log("Speech recognition restarted successfully")
            }, 500)
          } catch (reinitError) {
            console.error("Failed to reinitialize speech recognition:", reinitError)
            alert("Error starting speech recognition. Please refresh the page and try again.")
          }
        }
      })
      .catch((error) => {
        console.error("Microphone access error:", error)
        alert("Microphone access is required for speech recognition. Please allow microphone access and try again.")
      })
  }

  // Improved stop recording function
  function stopRecording() {
    isRecording = false
    updateRecordingUI()

    if (recognition) {
      try {
        recognition.stop()
        console.log("Speech recognition stopped")
      } catch (error) {
        console.error("Error stopping recognition:", error)
      }
    }

    // Stop spectrogram
    stopSpectrogram()

    // If no transcription was captured, show a message
    if (!currentTranscription.trim()) {
      transcriptionDisplay.innerHTML =
        '<p class="placeholder">No speech was detected. Please try again and speak clearly.</p>'
    }
  }

  // Toggle recording
  function toggleRecording() {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Handle file upload
  function handleFileUpload(file) {
    if (!file) return

    // Check if file is audio
    if (!file.type.startsWith("audio/")) {
      alert("Please upload an audio file (.wav or .mp3)")
      return
    }

    // Update UI
    fileName.textContent = file.name
    fileInfo.classList.remove("hidden")
    recordingStatus.classList.add("hidden")
    transcriptionDisplay.innerHTML = '<p class="placeholder">Transcribing audio...</p>'

    // Create FormData and send to server
    const formData = new FormData()
    formData.append("audio", file)
    formData.append("language", languageSelect.value)

    // Send to server for transcription
    fetch("/api/process-audio", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("API Response:", data)
        if (data.success) {
          // Update transcription display
          currentTranscription = data.transcription
          updateTranscriptionDisplay(currentTranscription)

          // Detect tone
          const tone = enhancedToneDetection(currentTranscription)
          displayTone(tone)
        } else {
          transcriptionDisplay.innerHTML = `<p class="error">Error: ${data.error}</p>`
        }
      })
      .catch((error) => {
        console.error("Error processing audio:", error)
        transcriptionDisplay.innerHTML = `<p class="error">Error processing audio. Please try again.</p>`
      })
  }

  // Simulate transcription process
  function simulateTranscription(file) {
    // Show loading state
    transcriptionDisplay.innerHTML = '<p class="placeholder">Transcribing audio...</p>'

    // In a real app, you would send the file to a server for processing
    // Here we'll simulate a delay and show a fake transcription
    setTimeout(() => {
      const fakeTranscriptions = [
        "Welcome to our speech-to-text dashboard. This is a demonstration of how the transcription would appear in a real application.",
        "Voice recognition technology has improved significantly in recent years, making it possible to accurately transcribe speech in multiple languages.",
        "This dashboard allows you to record audio, upload files, and see the transcription in real-time. You can also save the results in different formats.",
        "The training interface helps improve the model by collecting data from users. This collaborative approach leads to better accuracy over time.",
      ]

      // Pick a random transcription
      const randomIndex = Math.floor(Math.random() * fakeTranscriptions.length)
      currentTranscription = fakeTranscriptions[randomIndex]

      // Update display
      updateTranscriptionDisplay(currentTranscription)

      // Detect and display tone
      const tone = enhancedToneDetection(currentTranscription)
      displayTone(tone)
    }, 2000)
  }

  // Save as PDF (simulated)
  function savePDF() {
    if (!currentTranscription) {
      alert("No transcription to save. Please record or upload audio first.")
      return
    }

    // In a real app, you would call an API to generate a PDF
    generatePDF(currentTranscription, "Transcription")
  }

  // Save as DOCX (simulated)
  function saveDOCX() {
    if (!currentTranscription) {
      alert("No transcription to save. Please record or upload audio first.")
      return
    }

    // In a real app, you would call an API to generate a DOCX
    generateDOCX(currentTranscription, "Transcription")
  }

  // Download all formats (simulated)
  function downloadAll() {
    if (!currentTranscription) {
      alert("No transcription to save. Please record or upload audio first.")
      return
    }

    // Get the audio file path (this should be set when the audio file is uploaded)
    const audioFilePath = fileName.textContent

    // Create a new JSZip instance
    const JSZip =
      window.JSZip ||
      (() => {
        alert("ZIP functionality requires JSZip library. Using fallback method.")
        // Fallback: just generate individual files
        generatePDF(currentTranscription, "Transcription")
        generateDOCX(currentTranscription, "Transcription")
        return null
      })()

    if (JSZip) {
      const zip = new JSZip()

      // Add files to the zip
      // For PDF and DOCX, we'll need to fetch them as blobs first
      Promise.all([
        fetch("/api/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: currentTranscription, filename: "Transcription" }),
        }).then((response) => response.blob()),

        fetch("/api/generate-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: currentTranscription, filename: "Transcription" }),
        }).then((response) => response.blob()),

        fetch("/api/download-all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: currentTranscription,
            filename: "Transcription",
            audio_file_path: audioFilePath, // Include the audio file path
          }),
        }).then((response) => response.blob()),
      ])
        .then(([pdfBlob, docxBlob, audioBlob]) => {
          // Add files to zip
          zip.file("Transcription.pdf", pdfBlob)
          zip.file("Transcription.docx", docxBlob)
          zip.file(audioFilePath, audioBlob)

          // Generate the zip file
          return zip.generateAsync({ type: "blob" })
        })
        .then((zipBlob) => {
          // Create download link for the zip
          const url = window.URL.createObjectURL(zipBlob)
          const a = document.createElement("a")
          a.style.display = "none"
          a.href = url
          a.download = "Transcription_Files.zip"
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
        })
        .catch((error) => {
          console.error("Error creating ZIP file:", error)
          alert("Error creating ZIP file. Downloading individual files instead.")
          generatePDF(currentTranscription, "Transcription")
          generateDOCX(currentTranscription, "Transcription")
        })
    }
  }

  // Handle training form submission
  function handleTrainingSubmit(e) {
    e.preventDefault()

    const audioFile = trainingAudio.files[0]
    const transcript = document.getElementById("transcript").value
    const speakerName = document.getElementById("speaker-name").value

    if (!audioFile || !transcript) {
      alert("Please upload an audio file and provide a transcript.")
      return
    }

    // In a real app, you would send this data to a server
    alert("Training data submitted successfully! (This is a simulation)")

    // Reset form
    trainingForm.reset()
    trainingFileName.textContent = "No file selected"
  }

  // Handle feedback submission
  function handleFeedbackSubmit() {
    const feedback = feedbackText.value

    if (!feedback) {
      alert("Please enter your corrections before submitting.")
      return
    }

    // In a real app, you would send this data to a server
    alert("Feedback submitted successfully! Thank you for helping improve our system.")

    // Reset form
    feedbackText.value = ""
  }

  // Python modal functions
  function openPythonModal() {
    pythonModal.style.display = "block"
    pythonResult.classList.add("hidden")
    pythonStatus.innerHTML = '<p>Click "Start Recognition" to begin'

    // Initialize advanced spectrogram
    initAdvancedSpectrogram()
  }

  function closePythonModal() {
    pythonModal.style.display = "none"
    if (pythonRecognitionActive) {
      stopPythonRecognition()
    }

    // Stop advanced recognition if active
    if (advancedRecognition) {
      advancedRecognition.stop()
      advancedRecognition = null
    }
  }

  // Initialize spectrogram for advanced recognition
  function initAdvancedSpectrogram() {
    // Create spectrogram container if it doesn't exist
    if (!document.getElementById("advanced-spectrogram-container")) {
      const modalBody = document.querySelector(".modal-body")

      const spectrogramContainer = document.createElement("div")
      spectrogramContainer.id = "advanced-spectrogram-container"
      spectrogramContainer.style.marginTop = "1rem"
      spectrogramContainer.style.marginBottom = "1rem"

      const advancedSpectrogramCanvas = document.createElement("canvas")
      advancedSpectrogramCanvas.id = "advanced-spectrogram"
      advancedSpectrogramCanvas.width = modalBody.clientWidth - 40
      advancedSpectrogramCanvas.height = 150
      advancedSpectrogramCanvas.style.backgroundColor = "#000"
      advancedSpectrogramCanvas.style.borderRadius = "0.5rem"

      spectrogramContainer.appendChild(advancedSpectrogramCanvas)

      // Insert before python-status
      modalBody.insertBefore(spectrogramContainer, pythonStatus)
    }
  }

  // Draw advanced spectrogram
  function drawAdvancedSpectrogram(stream) {
    const advancedSpectrogramCanvas = document.getElementById("advanced-spectrogram")
    if (!advancedSpectrogramCanvas) return

    const advancedSpectrogramCtx = advancedSpectrogramCanvas.getContext("2d")

    // Initialize Web Audio API
    const advancedAudioContext = new (window.AudioContext || window.webkitAudioContext)()
    const advancedAnalyser = advancedAudioContext.createAnalyser()
    advancedAnalyser.fftSize = 2048

    const source = advancedAudioContext.createMediaStreamSource(stream)
    source.connect(advancedAnalyser)

    // Start drawing spectrogram
    const bufferLength = advancedAnalyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Variable to track average audio level
    let audioLevel = 0

    function draw() {
      if (!pythonRecognitionActive) {
        advancedAudioContext.close()
        cancelAnimationFrame(advancedSpectrogramAnimationId)
        return
      }

      advancedSpectrogramAnimationId = requestAnimationFrame(draw)

      advancedAnalyser.getByteFrequencyData(dataArray)

      advancedSpectrogramCtx.fillStyle = "rgb(0, 0, 0)"
      advancedSpectrogramCtx.fillRect(0, 0, advancedSpectrogramCanvas.width, advancedSpectrogramCanvas.height)

      const barWidth = (advancedSpectrogramCanvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      // Calculate average audio level
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      audioLevel = sum / bufferLength

      // Update tone based on audio level if we have text
      if (originalText.textContent && originalText.textContent.trim() !== "") {
        updateToneBasedOnAudioLevel(audioLevel, originalText.textContent)
      }

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        // Create gradient for visualization
        const gradient = advancedSpectrogramCtx.createLinearGradient(0, 0, 0, advancedSpectrogramCanvas.height)
        gradient.addColorStop(0, "rgb(0, 0, 255)") // Blue
        gradient.addColorStop(0.5, "rgb(128, 0, 255)") // Purple
        gradient.addColorStop(1, "rgb(255, 0, 255)") // Magenta

        advancedSpectrogramCtx.fillStyle = gradient
        advancedSpectrogramCtx.fillRect(x, advancedSpectrogramCanvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  // Update tone based on audio level and text content
  function updateToneBasedOnAudioLevel(audioLevel, text) {
    let tone = "Neutral"

    // Check audio level first
    if (audioLevel < 40) {
      // Low audio level - check for sad words
      if (containsSadWords(text)) {
        tone = "Sad"
      } else {
        tone = "Calm"
      }
    } else if (audioLevel > 70) {
      tone = "Excited"
    } else {
      // Medium level - check for happy words
      if (containsHappyWords(text)) {
        tone = "Happy"
      } else {
        tone = "Neutral"
      }
    }

    // Update the tone badge
    updateToneBadge(tone)
  }

  // Check if text contains sad words
  function containsSadWords(text) {
    const sadWords = ["broke", "death", "dead", "sad", "unhappy", "depressed", "sorry", "lost", "miss", "cry", "tears"]
    const textLower = text.toLowerCase()
    return sadWords.some((word) => textLower.includes(word))
  }

  // Check if text contains happy words
  function containsHappyWords(text) {
    const happyWords = [
      "happy",
      "joy",
      "great",
      "good",
      "wonderful",
      "love",
      "like",
      "won",
      "success",
      "smile",
      "laugh",
    ]
    const textLower = text.toLowerCase()
    return happyWords.some((word) => textLower.includes(word))
  }

  // Update the tone badge in the UI
  function updateToneBadge(tone) {
    if (detectedTone) {
      // Remove all existing tone classes
      detectedTone.classList.remove("happy", "sad", "angry", "neutral", "excited", "worried", "confused", "calm")

      // Add the new tone class
      detectedTone.classList.add(tone.toLowerCase())

      // Update the text
      detectedTone.textContent = tone
    }
  }

  // Function to analyze tone using AI
  async function analyzeToneAI(text) {
    if (!text || text.trim() === "") {
      updateToneBadge("Neutral");
      return;
    }

    try {
      // Send the text to the backend API for tone analysis
      const response = await fetch("/api/analyze-tone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the tone badge with the detected tone
        updateToneBadge(data.tone);
      } else {
        console.error("Tone analysis failed:", data.error);
        updateToneBadge("Neutral");
      }
    } catch (error) {
      console.error("Error analyzing tone:", error);
      updateToneBadge("Neutral");
    }
  }

  // Start Python recognition
  function startPythonRecognition() {
    if (pythonRecognitionActive) {
      stopPythonRecognition();
      return;
    }

    pythonRecognitionActive = true;
    startRecognitionBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recognition';
    pythonStatus.innerHTML = "<p>Listening... Please speak now.</p>";
    pythonResult.classList.add("hidden");

    const source = srcLanguage.value; // Source language
    const target = destLanguage.value; // Target language

    try {
      if (window.SpeechRecognition || window.webkitSpeechRecognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        advancedRecognition = new SpeechRecognition();

        // Set recognition parameters
        advancedRecognition.continuous = true; // Record until manually stopped
        advancedRecognition.interimResults = true;
        advancedRecognition.lang = source === "en" ? "en-US" : "hi-IN";

        let finalTranscript = "";

        // Handle recognition results
        advancedRecognition.onresult = (event) => {
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update the recognized text dynamically
          if (interimTranscript) {
            originalText.textContent = interimTranscript + "...";
          }
          if (finalTranscript) {
            originalText.textContent = finalTranscript;
          }
        };

        // Handle recognition end
        advancedRecognition.onend = async () => {
          console.log("Speech recognition ended");
          if (finalTranscript) {
            pythonStatus.innerHTML = "<p>Processing and translating...</p>";

            try {
              // Translate the full transcript
              const translatedResult = await translateText(finalTranscript, source, target);
              translatedTextElement.textContent = translatedResult;

              // Show results (but do not play automatically)
              pythonResult.classList.remove("hidden");
              pythonStatus.innerHTML = "<p>Recognition complete!</p>";
            } catch (error) {
              console.error("Translation error:", error);
              pythonStatus.innerHTML = "<p>Error translating text. Please try again.</p>";
            }
          } else {
            pythonStatus.innerHTML = "<p>No speech detected. Please try again.</p>";
          }

          stopPythonRecognition();
        };

        // Handle errors
        advancedRecognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          pythonStatus.innerHTML = `<p>Error: ${event.error}</p>`;
          stopPythonRecognition();
        };

        // Start recognition
        advancedRecognition.start();

        // Start spectrogram with audio level detection
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            audioStream = stream;
            drawAdvancedSpectrogram(stream);
          })
          .catch((error) => {
            console.error("Error accessing microphone:", error);
            pythonStatus.innerHTML = "<p>Error accessing microphone. Please check your settings.</p>";
            stopPythonRecognition();
          });
      } else {
        pythonStatus.innerHTML = "<p>Speech recognition not supported in this browser. Please try Chrome or Edge.</p>";
        stopPythonRecognition();
      }
    } catch (error) {
      console.error("Error initializing advanced recognition:", error);
      pythonStatus.innerHTML = "<p>Error initializing speech recognition. Please try again.</p>";
      stopPythonRecognition();
    }
  }

  // Stop Python recognition
  function stopPythonRecognition() {
    pythonRecognitionActive = false
    startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recognition'

    // Stop advanced recognition if active
    if (advancedRecognition) {
      try {
        advancedRecognition.stop()
      } catch (e) {
        console.log("Recognition already stopped")
      }
      advancedRecognition = null
    }

    // Stop spectrogram
    if (advancedSpectrogramAnimationId) {
      cancelAnimationFrame(advancedSpectrogramAnimationId)
      advancedSpectrogramAnimationId = null
    }

    // Clear the spectrogram
    const advancedSpectrogramCanvas = document.getElementById("advanced-spectrogram")
    if (advancedSpectrogramCanvas) {
      const advancedSpectrogramCtx = advancedSpectrogramCanvas.getContext("2d")
      advancedSpectrogramCtx.clearRect(0, 0, advancedSpectrogramCanvas.width, advancedSpectrogramCanvas.height)
    }

    // Stop any active media streams
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
      audioStream = null
    }
  }

  // Simple translation function
  async function translateText(text, srcLang, destLang) {
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, src_lang: srcLang, dest_lang: destLang }),
      })

      const data = await response.json()
      if (data.success) {
        return data.translated_text
      } else {
        console.error("Translation error:", data.error)
        return "Translation failed."
      }
    } catch (error) {
      console.error("Error translating text:", error)
      return "Error translating text."
    }
  }

  // Enhanced tone detection function
  function enhancedToneDetection(text) {
    if (!text) return "Neutral";

    const textLower = text.toLowerCase();

    // Expanded emotion dictionaries
    const happyWords = [
      "happy", "joy", "joyful", "delighted", "excited", "glad", "pleased", "thrilled", "wonderful",
      "amazing", "great", "good", "love", "like", "enjoy", "fantastic", "excellent", "awesome",
      "smile", "laugh", "fun", "celebrate", "congratulations", "perfect", "beautiful", "best", "won",
      "victory", "success", "cheerful", "ecstatic", "content", "satisfied", "grateful", "hopeful",
      "optimistic", "sunny", "radiant", "blissful", "elated", "overjoyed", "jubilant", "cheering"
    ];

    const sadWords = [
      "sad", "unhappy", "depressed", "depression", "miserable", "heartbroken", "disappointed", "upset",
      "terrible", "awful", "horrible", "hate", "dislike", "sorry", "regret", "cry", "tears", "grief",
      "mourn", "miss", "lost", "alone", "lonely", "unfortunate", "tragic", "failed", "failure", "broke",
      "death", "dead", "hopeless", "melancholy", "blue", "downcast", "sorrowful", "weeping", "brokenhearted",
      "despair", "forlorn", "heartache", "pain", "anguish", "torment", "suffering", "hurt", "loss","i lost", "lost", "disappointed", "upset", "terrible", "awful", "horrible", "hate", "dislike", "sorry", "regret", "cry", "tears", "grief", "mourn", "miss", "lost", "alone", "lonely", "unfortunate", "tragic", "failed", "failure", "broke",
      "death", "dead", "hopeless", "melancholy", "blue", "downcast", "sorrowful", "weeping", "brokenhearted", "despair",
      "forlorn", "heartache", "pain", "anguish", "torment", "suffering", "hurt", "loss",
    ];

    const angryWords = [
      "angry", "mad", "furious", "annoyed", "irritated", "frustrated", "rage", "hate", "outraged",
      "disgusted", "bitter", "hostile", "offended", "resent", "damn", "hell", "stupid", "idiot", "fool",
      "ridiculous", "unfair", "wrong", "yelling", "shouting", "screaming", "aggressive", "vengeful",
      "enraged", "infuriated", "exasperated", "provoked", "irate", "wrathful", "indignant", "cross",
      "grumpy", "irascible", "hot-tempered", "fuming", "seething", "boiling", "snapping", "hostility"
    ];

    const worriedWords = [
      "worry", "worried", "anxious", "anxiety", "nervous", "stress", "stressed", "concern", "concerned",
      "afraid", "fear", "scared", "frightened", "panic", "uneasy", "tense", "apprehensive", "dread",
      "doubt", "uncertain", "hesitant", "timid", "shaky", "jittery", "restless", "troubled", "distressed",
      "uneasiness", "fearful", "paranoid", "overthinking", "insecure", "distraught", "fretful", "wary",
      "alarmed", "on edge", "jumpy", "edgy", "perturbed", "disquieted", "agitated", "preoccupied"
    ];

    const excitedWords = [
      "excited", "thrilled", "ecstatic", "enthusiastic", "eager", "pumped", "stoked", "psyched",
      "exhilarated", "elated", "overjoyed", "jubilant", "can't wait", "looking forward", "anticipate",
      "anticipation", "energized", "delighted", "overexcited", "buzzing", "cheerful", "gleeful",
      "exuberant", "high-spirited", "vivacious", "bubbly", "zestful", "animated", "sparkling", "vibrant",
      "radiant", "joyous", "uplifted", "giddy", "ecstasy", "rapturous", "blissful", "euphoric", "jolly"
    ];

    const calmWords = [
      "calm", "peaceful", "relaxed", "serene", "tranquil", "quiet", "gentle", "soothing", "composed",
      "collected", "steady", "balanced", "centered", "still", "hushed", "placid", "restful", "untroubled",
      "cool", "composed", "laid-back", "easygoing", "content", "harmonious", "mellow", "unruffled",
      "undisturbed", "unperturbed", "equanimous", "zen", "meditative", "mindful", "grounded", "stable",
      "poised", "peaceable", "unflappable", "serenity", "tranquility", "ease", "comfort", "relaxation"
    ];

    // Count exclamation marks and question marks
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?/g) || []).length;

    // Count occurrences of emotion words
    let happyCount = 0;
    let sadCount = 0;
    let angryCount = 0;
    let worriedCount = 0;
    let excitedCount = 0;
    let calmCount = 0;

    happyWords.forEach((word) => {
      if (textLower.includes(word)) happyCount++;
    });

    sadWords.forEach((word) => {
      if (textLower.includes(word)) sadCount++;
    });

    angryWords.forEach((word) => {
      if (textLower.includes(word)) angryCount++;
    });

    worriedWords.forEach((word) => {
      if (textLower.includes(word)) worriedCount++;
    });

    excitedWords.forEach((word) => {
      if (textLower.includes(word)) excitedCount++;
    });

    calmWords.forEach((word) => {
      if (textLower.includes(word)) calmCount++;
    });

    // Apply weights to different factors
    if (exclamationCount > 1) {
      if (angryCount > 0) {
        angryCount += exclamationCount;
      } else if (excitedCount > 0) {
        excitedCount += exclamationCount;
      } else {
        happyCount += exclamationCount;
      }
    }

    if (questionCount > 1) {
      worriedCount += questionCount / 2;
    }

    // Determine the dominant emotion
    const emotions = [
      { name: "Happy", count: happyCount },
      { name: "Sad", count: sadCount },
      { name: "Angry", count: angryCount },
      { name: "Worried", count: worriedCount },
      { name: "Excited", count: excitedCount },
      { name: "Calm", count: calmCount },
    ];

    // Sort emotions by count in descending order
    emotions.sort((a, b) => b.count - a.count);

    // If the highest count is 0 or very low, return Neutral
    if (emotions[0].count <= 1) {
      return "Neutral";
    }

    return emotions[0].name;
  }

  // Display tone in the UI
  function displayTone(tone) {
    // Create or find the tone container
    let toneContainer = document.getElementById("tone-container")
    if (!toneContainer) {
      toneContainer = document.createElement("div")
      toneContainer.id = "tone-container"
      toneContainer.className = "tone-container"

      const toneTitle = document.createElement("h4")
      toneTitle.textContent = "Detected Tone:"
      toneContainer.appendChild(toneTitle)

      const toneBadges = document.createElement("div")
      toneBadges.className = "tone-badges"

      const toneBadge = document.createElement("span")
      toneBadge.id = "detected-tone-main"
      toneBadge.className = "tone-badge"
      toneBadges.appendChild(toneBadge)

      toneContainer.appendChild(toneBadges)

      // Insert after transcription display
      transcriptionDisplay.parentNode.insertBefore(toneContainer, transcriptionDisplay.nextSibling)
    }

    // Update the tone badge
    const toneBadge = document.getElementById("detected-tone-main")
    if (toneBadge) {
      // Remove all existing tone classes
      toneBadge.classList.remove("happy", "sad", "angry", "neutral", "excited", "worried", "confused", "calm")

      // Add the new tone class
      toneBadge.classList.add(tone.toLowerCase())

      // Update the text
      toneBadge.textContent = tone
    }
  }

  function generateSummary(text) {
    if (!text || text.length < 50) {
      return "Text is too short to summarize."
    }

    // Send to server for summarization
    return fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          return data.summary
        } else {
          throw new Error(data.error || "Failed to generate summary")
        }
      })
      .catch((error) => {
        console.error("Error generating summary:", error)

        // Enhanced client-side summarization as fallback
        return improvedClientSideSummarize(text)
      })
  }

  // Add this new improved summarization function
  function improvedClientSideSummarize(text) {
    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

    if (sentences.length <= 3) {
      return text
    }

    // Calculate word frequency for better sentence scoring
    const wordFrequency = {}
    const words = text.toLowerCase().match(/\b\w+\b/g) || []

    // Ignore common stop words
    const stopWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "is",
      "are",
      "was",
      "were",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "about",
      "like",
      "from",
      "of",
      "that",
      "this",
      "there",
      "it",
      "as",
      "be",
      "been",
    ]

    // Count word frequency, ignoring stop words
    words.forEach((word) => {
      if (word.length > 2 && !stopWords.includes(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1
      }
    })

    // Score each sentence based on:
    // 1. Word frequency
    // 2. Sentence position (first and last sentences often contain key information)
    // 3. Sentence length (avoid very short sentences)
    const sentenceScores = sentences.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().match(/\b\w+\b/g) || []
      let score = 0

      // Score based on word frequency
      sentenceWords.forEach((word) => {
        if (wordFrequency[word]) {
          score += wordFrequency[word]
        }
      })

      // Normalize by sentence length to avoid bias towards longer sentences
      if (sentenceWords.length > 0) {
        score = score / sentenceWords.length
      }

      // Boost score for first and last sentences
      if (index === 0 || index === sentences.length - 1) {
        score *= 1.25
      }

      // Penalize very short sentences
      if (sentenceWords.length < 4) {
        score *= 0.7
      }

      return {
        sentence,
        score,
        index,
      }
    })

    // Get top 3 sentences
    const topSentences = sentenceScores.sort((a, b) => b.score - a.score).slice(0, 3)

    // Sort by original order
    topSentences.sort((a, b) => a.index - b.index)

    // Join sentences
    return topSentences.map((item) => item.sentence).join(". ") + "."
  }

  // Add event listener for the summarize button
  if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
      if (!currentTranscription) {
        alert("No transcription to summarize. Please record or upload audio first.")
        return
      }

      // Show loading state
      summarizeBtn.disabled = true
      summarizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...'

      try {
        // Create or find the summary container
        let summaryContainer = document.getElementById("summary-container")
        if (!summaryContainer) {
          summaryContainer = document.createElement("div")
          summaryContainer.id = "summary-container"
          summaryContainer.className = "summary-container"

          const summaryTitle = document.createElement("h4")
          summaryTitle.textContent = "Summary:"
          summaryContainer.appendChild(summaryTitle)

          const summaryContent = document.createElement("p")
          summaryContent.id = "summary-content"
          summaryContainer.appendChild(summaryContent)

          // Insert after transcription display
          transcriptionDisplay.parentNode.insertBefore(summaryContainer, transcriptionDisplay.nextSibling)
        }

        // Generate summary using the improved function
        const summary = await improvedClientSideSummarize(currentTranscription)

        // Display the summary
        document.getElementById("summary-content").textContent = summary

        // Show the summary container
        summaryContainer.style.display = "block"

        // Scroll to the summary
        summaryContainer.scrollIntoView({ behavior: "smooth" })
      } catch (error) {
        console.error("Error generating summary:", error)
        alert("Failed to generate summary. Please try again.")
      } finally {
        // Reset button state
        summarizeBtn.disabled = false
        summarizeBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Summarize'
      }
    })
  }

  // Get language name from code
  function getLanguageName(langCode) {
    const languages = {
      auto: "Auto-detect",
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      ja: "Japanese",
      ko: "Korean",
      "zh-CN": "Chinese (Simplified)",
      ru: "Russian",
      ar: "Arabic",
      hi: "Hindi",
    }

    return languages[langCode] || langCode
  }

  // Play translation
  function playTranslation() {
    const translatedText = translatedTextElement.textContent; // Get the translated text
    const targetLanguage = destLanguage.value; // Get the target language

    if (!translatedText) {
      alert("No translation available to play.");
      return;
    }

    // Call the backend API to play the translation
    fetch("/api/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: translatedText,
        language: targetLanguage,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Text spoken successfully.");
        } else {
          console.error("Error speaking text:", data.error);
          alert("Error: " + data.error);
        }
      })
      .catch((error) => {
        console.error("Error calling /api/speak:", error);
        alert("An error occurred while trying to play the translation.");
      });
  }

  // Generate PDF from text
  function generatePDF(text, filename = "document") {
    // In a real app, this would call the backend API to generate a PDF
    fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        filename: filename,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.blob()
        }
        throw new Error("Network response was not ok.")
      })
      .then((blob) => {
        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `${filename}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error("Error generating PDF:", error)
        // Fallback if API fails
        alert("PDF saved successfully! (This is a simulation)")
      })
  }

  // Generate DOCX from text
  function generateDOCX(text, filename = "document") {
    // In a real app, this would call the backend API to generate a DOCX
    fetch("/api/generate-docx", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        filename: filename,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.blob()
        }
        throw new Error("Network response was not ok.")
      })
      .then((blob) => {
        // Create a download link and trigger it
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `${filename}.docx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch((error) => {
        console.error("Error generating DOCX:", error)
        // Create a simple DOCX using client-side library if available
        try {
          if (window.docx) {
            const doc = new window.docx.Document()
            doc.addParagraph(new window.docx.Paragraph(text))
            window.docx.Packer.toBlob(doc).then((blob) => {
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.style.display = "none"
              a.href = url
              a.download = `${filename}.docx`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
            })
          } else {
            throw new Error("DOCX library not available")
          }
        } catch (e) {
          console.error("Client-side DOCX generation failed:", e)
          alert("DOCX saved successfully! (This is a simulation)")
        }
      })
  }

  // Save Python recognition results as PDF
  function savePythonPDF() {
    if (!recognitionResults) {
      alert("No recognition results to save. Please perform recognition first.")
      return
    }

    const content = `
Original Text (${recognitionResults.srcLangName}):
${recognitionResults.original}

Translated Text (${recognitionResults.destLangName}):
${recognitionResults.translated}

Tone: ${recognitionResults.tone}

Summary:
${recognitionResults.summary}
    `

    generatePDF(content, "Speech_Recognition_Results")
  }

  // Save Python recognition results as DOCX
  function savePythonDOCX() {
    if (!recognitionResults) {
      alert("No recognition results to save. Please perform recognition first.")
      return
    }

    const content = `
Original Text (${recognitionResults.srcLangName}):
${recognitionResults.original}

Translated Text (${recognitionResults.destLangName}):
${recognitionResults.translated}

Tone: ${recognitionResults.tone}

Summary:
${recognitionResults.summary}
    `

    generateDOCX(content, "Speech_Recognition_Results")
  }

  // Download all Python recognition results
  function downloadAllPython() {
    if (!recognitionResults) {
      alert("No recognition results to save. Please perform recognition first.")
      return
    }

    savePythonPDF()
    savePythonDOCX()
  }

  // Event Listeners
  voiceInputBtn.addEventListener("click", toggleRecording)

  uploadBtn.addEventListener("click", () => {
    audioUpload.click()
  })

  audioUpload.addEventListener("change", (e) => {
    handleFileUpload(e.target.files[0])
  })

  languageSelect.addEventListener("change", () => {
    if (recognition) {
      recognition.lang = languageSelect.value
    }
  })

  savePdfBtn.addEventListener("click", savePDF)
  saveDocxBtn.addEventListener("click", saveDOCX)
  downloadAllBtn.addEventListener("click", downloadAll)

  trainingUploadBtn.addEventListener("click", () => {
    trainingAudio.click()
  })

  trainingAudio.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      trainingFileName.textContent = file.name
    }
  })

  trainingForm.addEventListener("submit", handleTrainingSubmit)
  submitFeedback.addEventListener("click", handleFeedbackSubmit)

  // Python modal event listeners
  launchPythonBtn.addEventListener("click", openPythonModal)
  closeModalBtn.addEventListener("click", closePythonModal)
  closeSpan.addEventListener("click", closePythonModal)
  startRecognitionBtn.addEventListener("click", startPythonRecognition)
  playTranslationBtn.addEventListener("click", () => {
    const translatedText = translatedTextElement.textContent;
    const targetLanguage = destLanguage.value;

    playTranslationAdvanced(translatedText, targetLanguage);
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === pythonModal) {
      closePythonModal()
    }
  })

  // Initialize
  initSpeechRecognition()

  // Simulate visualization data updates
  function updateVisualizations() {
    const progressBars = document.querySelectorAll(".progress-bar")

    progressBars.forEach((bar) => {
      // Get current width
      const currentWidth = Number.parseInt(bar.style.width)

      // Random fluctuation between -5% and +5%
      const fluctuation = Math.random() * 10 - 5

      // Calculate new width (keep between 10% and 95%)
      let newWidth = currentWidth + fluctuation
      newWidth = Math.max(10, Math.min(95, newWidth))

      // Update width and text
      bar.style.width = `${newWidth}%`
      bar.innerHTML = `<span>${Math.round(newWidth)}%</span>`
    })
  }

  // Run visualization updates every 5 seconds
  setInterval(updateVisualizations, 5000)

  // Initialize visualizations on load
  updateVisualizations()

  // Handle drag and drop for file uploads
  const dropZones = [transcriptionDisplay, document.querySelector(".transcription-card")]

  dropZones.forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault()
      zone.classList.add("drag-over")
    })

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over")
    })

    zone.addEventListener("drop", (e) => {
      e.preventDefault()
      zone.classList.remove("drag-over")

      if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0])
      }
    })
  })

  // Add this function to check microphone status
  function checkMicrophoneStatus() {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Check if there are audio tracks
        if (stream.getAudioTracks().length > 0) {
          const track = stream.getAudioTracks()[0]
          console.log("Microphone found:", track.label)

          // Check if the track is enabled
          if (track.enabled) {
            console.log("Microphone is enabled")
          } else {
            console.warn("Microphone is disabled")
            alert("Your microphone appears to be disabled. Please enable it for speech recognition to work.")
          }

          // Stop the stream
          stream.getTracks().forEach((track) => track.stop())
        } else {
          console.warn("No audio tracks found")
          alert("No microphone detected. Please connect a microphone and try again.")
        }
      })
      .catch((error) => {
        console.error("Microphone check error:", error)
        alert("Unable to access microphone. Please check your microphone settings and permissions.")
      })
  }

  // Check microphone status on page load
  checkMicrophoneStatus()

  function playTranslationAdvanced(translatedText, targetLanguage) {
    if (!translatedText) {
      alert("No translation available to play.");
      return;
    }

    // Use Web Speech API for text-to-speech
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(translatedText);

      // Set the language for the utterance
      utterance.lang = targetLanguage === "en" ? "en-US" : targetLanguage;

      // Speak the text
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  }
})
