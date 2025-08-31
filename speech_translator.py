import speech_recognition as sr
from deep_translator import GoogleTranslator
import pyttsx3
import time
import os
from jiwer import wer

class SpeechTranslator:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.engine = pyttsx3.init()
        
        # Available languages (ISO 639-1 codes)
        self.languages = {
            "en": "English",
            "hi": "Hindi",
            "es": "Spanish",
            "fr": "French",
            "de": "German",
            "it": "Italian",
            "ja": "Japanese",
            "ko": "Korean",
            "zh-CN": "Chinese (Simplified)",
            "ru": "Russian",
            "ar": "Arabic"
        }
        
        # Set up Indian English voice if available
        self.setup_indian_voice()
    
    def setup_indian_voice(self):
        """Try to find and set an Indian English voice"""
        voices = self.engine.getProperty('voices')
        indian_voice = None
        
        # Print available voices for debugging
        print("\nAvailable voices:")
        for i, voice in enumerate(voices):
            print(f"Voice {i}: {voice.name} ({voice.id})")
            # Look for voices that might be Indian English
            if any(term in voice.name.lower() for term in ["indian", "hindi", "india"]):
                indian_voice = voice
                print(f"Found potential Indian voice: {voice.name}")
        
        # Set default voice to Indian if found, otherwise use system default
        if indian_voice:
            self.engine.setProperty('voice', indian_voice.id)
            print(f"Set default voice to: {indian_voice.name}")
        else:
            print("No specific Indian voice found. Using system default.")
            
        # Adjust speech rate and volume
        self.engine.setProperty('rate', 150)  # Speed of speech
        self.engine.setProperty('volume', 0.9)  # Volume (0.0 to 1.0)
    
    def list_languages(self):
        """Display available languages"""
        print("\nAvailable languages:")
        for code, name in self.languages.items():
            print(f"  {code}: {name}")
    
    def recognize_speech(self, language="en-US"):
        """Recognize speech from the microphone."""
        recognizer = sr.Recognizer()

        with sr.Microphone() as source:
            print("Adjusting for ambient noise... Please wait.")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print("Listening...")
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                print("Processing speech...")
                text = recognizer.recognize_google(audio, language="en-US")
                print(f"Recognized: {text}")
                return text
            except sr.UnknownValueError:
                print("Could not understand audio")
                return None
            except sr.RequestError as e:
                print(f"Recognition error: {e}")
                return None
    
    def translate_text(self, text, src="auto", dest="en"):
        """Translate text from source language to destination language."""
        try:
            translator = GoogleTranslator(source=src, target=dest)
            translated_text = translator.translate(text)
        
            # Debugging: Log the translation process
            print(f"Translating from {src} to {dest}: '{text}' -> '{translated_text}'")
        
            return translated_text
        except Exception as e:
            print(f"Translation error: {e}")
            return None
    
    def speak_text(self, text, language="en"):
        """Convert text to speech"""
        if not text:
            return
        
        # Set voice properties based on language
        voices = self.engine.getProperty('voices')
        
        # Voice selection logic
        if language == "hi":
            # Try to find a Hindi voice
            hindi_voice = None
            for voice in voices:
                if any(term in voice.name.lower() for term in ["hindi", "indian", "india"]):
                    hindi_voice = voice
                    break
            
            if hindi_voice:
                self.engine.setProperty('voice', hindi_voice.id)
                print(f"Using voice: {hindi_voice.name} for Hindi")
            else:
                # If no Hindi voice, use default voice
                print("No specific Hindi voice found. Using default voice.")
        
        elif language == "en":
            # For English, use the Indian English voice we set up earlier
            # This is already handled in setup_indian_voice()
            pass
        
        elif language in ["es", "it", "fr"]:
            # For Romance languages, try to use an appropriate voice
            for voice in voices:
                if any(lang in voice.name.lower() for lang in [language, "spanish", "italian", "french"]):
                    self.engine.setProperty('voice', voice.id)
                    print(f"Using voice: {voice.name}")
                    break
        
        # Speak the text
        self.engine.say(text)
        self.engine.runAndWait()
        
        # Reset to default Indian English voice after speaking
        self.setup_indian_voice()

    # Add a method to transcribe audio files
    def transcribe_audio_file(self, file_path, language="en-US"):
        """Transcribe an uploaded audio file into text."""
        try:
            # Check if file exists
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                return None
                
            # Convert audio file to WAV format if necessary
            if not file_path.endswith(".wav"):
                try:
                    from pydub import AudioSegment
                    audio = AudioSegment.from_file(file_path)
                    wav_path = file_path.rsplit(".", 1)[0] + ".wav"
                    audio.export(wav_path, format="wav")
                    file_path = wav_path
                    print(f"Converted audio to WAV: {file_path}")
                except ImportError:
                    print("pydub not available, trying to process file directly")
                except Exception as e:
                    print(f"Error converting audio: {e}")
                    return None

            # Load the audio file
            with sr.AudioFile(file_path) as source:
                print("Processing audio file...")
                audio_data = self.recognizer.record(source)

            # Recognize speech in the audio file
            text = self.recognizer.recognize_google(audio_data, language=language)
            print(f"Transcription: {text}")
            return text

        except sr.UnknownValueError:
            print("Could not understand the audio.")
            return None
        except sr.RequestError as e:
            print(f"Error with the speech recognition service: {e}")
            return None
        except Exception as e:
            print(f"Error processing audio file: {e}")
            return None

    # Add a method to detect tone
    def detect_tone(self, text):
        """
        Detect the emotional tone of the text using a more sophisticated approach.
        Returns one of: Happy, Sad, Angry, Neutral, Excited, Worried, Confused
        """
        if not text:
            return "Neutral"
        
        try:
            # Try to use TextBlob for sentiment analysis if available
            from textblob import TextBlob
            
            # Get sentiment polarity (-1 to 1) and subjectivity (0 to 1)
            analysis = TextBlob(text)
            polarity = analysis.sentiment.polarity
            subjectivity = analysis.sentiment.subjectivity
            
            # Determine tone based on polarity and subjectivity
            if polarity > 0.5:
                return "Happy" if subjectivity < 0.6 else "Excited"
            elif polarity > 0.1:
                return "Happy"
            elif polarity < -0.5:
                return "Angry" if "!" in text else "Sad"
            elif polarity < -0.1:
                return "Sad"
            else:
                # Check for question marks to detect confusion
                if "?" in text and text.count("?") > 1:
                    return "Confused"
                # Check for specific worry indicators
                elif any(word in text.lower() for word in ["worry", "worried", "concern", "afraid", "fear", "anxious"]):
                    return "Worried"
                else:
                    return "Neutral"
        
        except ImportError:
            # Fallback to enhanced keyword-based approach
            text_lower = text.lower()
            
            # More comprehensive emotion dictionaries
            happy_words = [
                "happy", "joy", "joyful", "delighted", "excited", "glad", "pleased", 
                "thrilled", "wonderful", "amazing", "great", "good", "love", "like", 
                "enjoy", "fantastic", "excellent", "awesome", "smile", "laugh", "fun",
                "celebrate", "congratulations", "perfect", "beautiful", "best"
            ]
            
            sad_words = [
                "sad", "unhappy", "depressed", "depression", "miserable", "heartbroken", 
                "disappointed", "upset", "terrible", "awful", "horrible", "hate", "dislike", 
                "sorry", "regret", "cry", "tears", "grief", "mourn", "miss", "lost", "alone",
                "lonely", "unfortunate", "tragic", "failed", "failure", "passed away", "died"
            ]
            
            angry_words = [
                "angry", "mad", "furious", "annoyed", "irritated", "frustrated", "rage", 
                "hate", "outraged", "disgusted", "bitter", "hostile", "offended", "resent",
                "damn", "hell", "stupid", "idiot", "fool", "ridiculous", "unfair", "wrong"
            ]
            
            worried_words = [
                "worry", "worried", "anxious", "anxiety", "nervous", "stress", "stressed",
                "concern", "concerned", "afraid", "fear", "scared", "frightened", "panic",
                "uneasy", "tense", "apprehensive", "dread", "doubt", "uncertain"
            ]
            
            confused_words = [
                "confused", "confusing", "confusion", "puzzled", "perplexed", "unsure",
                "uncertain", "doubt", "wondering", "wonder", "understand", "complicated"
            ]
            
            # Count exclamation marks and question marks
            exclamation_count = text.count("!")
            question_count = text.count("?")
            
            # Count occurrences of emotion words
            happy_count = sum(1 for word in happy_words if word in text_lower)
            sad_count = sum(1 for word in sad_words if word in text_lower)
            angry_count = sum(1 for word in angry_words if word in text_lower)
            worried_count = sum(1 for word in worried_words if word in worried_words if word in text_lower)
            confused_count = sum(1 for word in confused_words if word in text_lower)
            
            # Apply weights to different factors
            if exclamation_count > 1:
                if angry_count > 0:
                    angry_count += exclamation_count
                else:
                    happy_count += exclamation_count
            
            if question_count > 1:
                confused_count += question_count
            
            # Check for specific phrases that strongly indicate emotions
            if "my mother passed away" in text_lower or "my father passed away" in text_lower:
                sad_count += 5
            
            if "congratulations" in text_lower or "well done" in text_lower:
                happy_count += 3
            
            # Determine the dominant emotion
            max_count = max(happy_count, sad_count, angry_count, worried_count, confused_count)
            
            if max_count == 0:
                return "Neutral"
            elif max_count == happy_count:
                return "Excited" if exclamation_count > 1 else "Happy"
            elif max_count == sad_count:
                return "Sad"
            elif max_count == angry_count:
                return "Angry"
            elif max_count == worried_count:
                return "Worried"
            elif max_count == confused_count:
                return "Confused"
            else:
                return "Neutral"

    # Improved method to generate a summary
    def generate_summary(self, text):
        """Generate a summary of the text."""
        if not text or len(text) < 50:
            return "Text is too short to summarize."
        
        # Improved extractive summarization
        sentences = text.split('.')
        if len(sentences) <= 3:
            return text
        
        # Calculate word frequency
        word_freq = {}
        # Define stop words to ignore
        stop_words = ["the", "a", "an", "and", "or", "but", "is", "are", "was", "were", 
                      "in", "on", "at", "to", "for", "with", "by", "about", "like", 
                      "from", "of", "that", "this", "there", "it", "as", "be", "been"]
        
        for sentence in sentences:
            words = sentence.lower().split()
            for word in words:
                if word not in stop_words and len(word) > 3:
                    if word not in word_freq:
                        word_freq[word] = 1
                    else:
                        word_freq[word] += 1
        
        # Score sentences based on word frequency and position
        sentence_scores = []
        for i, sentence in enumerate(sentences):
            if not sentence.strip():
                continue
                
            words = sentence.lower().split()
            score = sum(word_freq.get(word, 0) for word in words) / max(len(words), 1)
            
            # Give higher weight to first and last sentences
            if i == 0 or i == len(sentences) - 1:
                score *= 1.25
                
            # Penalize very short sentences
            if len(words) < 4:
                score *= 0.7
                
            sentence_scores.append((sentence, score, i))
        
        # Get top 3 sentences
        top_sentences = sorted(sentence_scores, key=lambda x: x[1], reverse=True)[:3]
        
        # Sort by original order
        top_sentences.sort(key=lambda x: x[2])
        
        # Join sentences
        summary = '. '.join(sentence[0] for sentence in top_sentences) + '.'
        return summary

# Function to calculate Word Error Rate (WER)
# def calculate_wer(reference, hypothesis):
#     """
#     Calculate the Word Error Rate (WER) between the reference and hypothesis.
#     :param reference: The ground truth text.
#     :param hypothesis: The transcribed text.
#     :return: WER as a percentage.
#     """
#     error_rate = wer(reference, hypothesis)
#     print(f"WER: {error_rate * 100:.2f}%")
#     return error_rate

# Example usage of the SpeechTranslator class
translator = SpeechTranslator()
result = translator.translate_text("नमस्ते", src="hi", dest="en")
print(result)  # Expected output: "Hello"

reference_text = "This is the correct transcription."
transcribed_text = "This is the transcription."

# Calculate WER
# error_rate = calculate_wer(reference_text, transcribed_text)
# print(f"Word Error Rate: {error_rate * 100:.2f}%")
