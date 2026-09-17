import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  ChevronDown,
  Hand,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";

import "./Communicate.css";

const API_URL = "http://localhost:5000/api";

/* =========================================================
   SIGN IMAGE LIBRARY
   Images are stored in /public/signs/
   ========================================================= */

const SIGN_LIBRARY = {
  hello: {
    label: "Hello",
    image: "/signs/hello.jpg",
  },

  help: {
    label: "Help",
    image: "/signs/help.jpg",
  },

  yes: {
    label: "Yes",
    image: "/signs/yes.jpg",
  },

  no: {
    label: "No",
    image: "/signs/no.jpg",
  },

  "thank-you": {
    label: "Thank you",
    image: "/signs/thank-you.jpg",
  },

  water: {
    label: "Water",
    image: "/signs/water.jpg",
  },

  food: {
    label: "Food",
    image: "/signs/food.jpg",
  },

  doctor: {
    label: "Doctor",
    image: "/signs/doctor.jpg",
  },

  sorry: {
    label: "Sorry",
    image: "/signs/sorry.jpg",
  },

  "how-are-you": {
    label: "How are you?",
    image: "/signs/how-are-you.jpg",
  },

  "please-wait": {
    label: "Please wait",
    image: "/signs/please-wait.jpg",
  },
};


/* =========================================================
   PHRASE → SIGN MAPPING
   ========================================================= */

const PHRASE_SIGNS = {
  hello: ["hello"],
  hi: ["hello"],

  help: ["help"],
  "i need help": ["help"],

  "i need a doctor": ["doctor"],
  "need a doctor": ["doctor"],
  doctor: ["doctor"],

  "i need water": ["water"],
  water: ["water"],

  food: ["food"],

  "thank you": ["thank-you"],
  thanks: ["thank-you"],

  sorry: ["sorry"],

  yes: ["yes"],
  no: ["no"],

  "how are you": ["how-are-you"],

  "please wait": ["please-wait"],
};


/* =========================================================
   TEXT TO SPEECH
   ========================================================= */

function speakText(text, rate = 0.95) {
  if (!window.speechSynthesis || !text.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-IN";
  utterance.rate = rate;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);

  return true;
}


/* =========================================================
   NORMALIZE TEXT
   ========================================================= */

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


/* =========================================================
   GET SIGN SEQUENCE FROM TEXT
   ========================================================= */

function getSignSequence(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  /* Exact phrase */
  if (PHRASE_SIGNS[normalized]) {
    return PHRASE_SIGNS[normalized]
      .map((key) => {
        if (!SIGN_LIBRARY[key]) return null;

        return {
          key,
          ...SIGN_LIBRARY[key],
        };
      })
      .filter(Boolean);
  }

  /* Individual words */
  const words = normalized.split(" ");
  const result = [];

  words.forEach((word) => {
    if (PHRASE_SIGNS[word]) {
      PHRASE_SIGNS[word].forEach((key) => {
        if (SIGN_LIBRARY[key]) {
          result.push({
            key,
            ...SIGN_LIBRARY[key],
          });
        }
      });
    }
  });

  return result;
}


/* =========================================================
   COMMUNICATION PAGE
   ========================================================= */

export default function Communicate() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const recognitionFinalRef = useRef("");

  /* Real ML recognition timer */
  const detectionTimerRef = useRef(null);

  /* Prevent multiple prediction requests at once */
  const predictionBusyRef = useRef(false);

  /* Unique browser session for ML frame sequence */
  const clientIdRef = useRef(
    `signbridge-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`
  );

  /* Used to invalidate old recognition loops */
  const recognitionSessionRef = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  const [detectedKey, setDetectedKey] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const [textInput, setTextInput] = useState("");
  const [signSequence, setSignSequence] = useState([]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [listening, setListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const [autoSpeak, setAutoSpeak] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);

  const [messages, setMessages] = useState([]);

  const [conversationLoading, setConversationLoading] =
    useState(true);

  const [conversationError, setConversationError] =
    useState("");


  /* =======================================================
     CURRENT DETECTED SIGN
     ======================================================= */

  const detectedSign = detectedKey
    ? SIGN_LIBRARY[detectedKey]
    : null;


  /* =======================================================
     MESSAGE COUNT
     ======================================================= */

  const messageCountLabel = useMemo(
    () =>
      `${messages.length} message${
        messages.length === 1 ? "" : "s"
      }`,
    [messages.length]
  );


  /* =======================================================
     LOAD CONVERSATION FROM BACKEND
     ======================================================= */

  useEffect(() => {
    async function loadConversation() {
      try {
        setConversationLoading(true);
        setConversationError("");

        const response = await fetch(
          `${API_URL}/conversation`
        );

        if (!response.ok) {
          throw new Error("Failed to load conversation");
        }

        const result = await response.json();

        setMessages(result.data || []);
      } catch (error) {
        console.error(
          "Conversation loading error:",
          error
        );

        setConversationError(
          "Unable to connect to the conversation server."
        );
      } finally {
        setConversationLoading(false);
      }
    }

    loadConversation();
  }, []);


  /* =======================================================
     CLEANUP
     ======================================================= */

  useEffect(() => {
    return () => {
      stopCamera();
      stopListening();

      window.speechSynthesis?.cancel();
    };
  }, []);


  /* =======================================================
     CONNECT CAMERA STREAM TO VIDEO
     ======================================================= */

  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);


  /* =======================================================
     STOP ML RECOGNITION
     ======================================================= */

  function stopDetection() {
    recognitionSessionRef.current += 1;

    if (detectionTimerRef.current) {
      window.clearInterval(
        detectionTimerRef.current
      );

      detectionTimerRef.current = null;
    }

    predictionBusyRef.current = false;

    setRecognizing(false);
  }


  /* =======================================================
     RESET ML SEQUENCE
     ======================================================= */

  async function resetMLSequence() {
    try {
      await fetch(`${API_URL}/ml/reset`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          client_id: clientIdRef.current,
        }),
      });
    } catch (error) {
      console.error(
        "ML sequence reset error:",
        error
      );
    }
  }


  /* =======================================================
     START CAMERA
     ======================================================= */

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(
        "Camera access is not supported in this browser."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      setCameraOn(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (error) {
      console.error(error);

      alert(
        "Camera permission was not granted. Please allow camera access and try again."
      );
    }
  }


  /* =======================================================
     STOP CAMERA
     ======================================================= */

  function stopCamera() {
    stopDetection();

    resetMLSequence();

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setRecognizing(false);
    setDetectedKey(null);
    setConfidence(0);
  }


  /* =======================================================
     CAPTURE CURRENT VIDEO FRAME
     ======================================================= */

      function captureVideoFrame() {
        const video = videoRef.current;

        if (!video) {
          return null;
        }

        if (
          video.readyState < 2 ||
          !video.videoWidth ||
          !video.videoHeight
        ) {
          return null;
        }

        const canvas = document.createElement("canvas");

        const maxWidth = 640;

        const scale = Math.min(
          1,
          maxWidth / video.videoWidth
        );

        canvas.width = Math.round(
          video.videoWidth * scale
        );

        canvas.height = Math.round(
          video.videoHeight * scale
        );

        const context = canvas.getContext("2d");

        if (!context) {
          return null;
        }

        /*
          IMPORTANT:
          Mirror the frame before sending it to Python.

          The ML training/prediction camera uses a
          horizontally flipped webcam frame.
        */

        context.save();

        context.translate(
          canvas.width,
          0
        );

        context.scale(-1, 1);

        context.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.restore();

        return canvas.toDataURL(
          "image/jpeg",
          0.7
        );
      }




  /* =======================================================
     SEND FRAME TO ML BACKEND
     ======================================================= */

  async function predictCurrentFrame(
    sessionId
  ) {
    if (
      predictionBusyRef.current ||
      !videoRef.current ||
      !cameraOn
    ) {
      return;
    }

    /*
      Ignore results from an old recognition session.
    */
    if (
      sessionId !==
      recognitionSessionRef.current
    ) {
      return;
    }

    const image = captureVideoFrame();

    if (!image) {
      return;
    }

    predictionBusyRef.current = true;

    try {
      const response = await fetch(
        `${API_URL}/ml/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            image,
            client_id: clientIdRef.current,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `ML prediction request failed: ${response.status}`
        );
      }

      const result =
        await response.json();

      /*
        Check again because the user may have
        stopped recognition while the request
        was running.
      */
      if (
        sessionId !==
        recognitionSessionRef.current
      ) {
        return;
      }

      if (
        result.success &&
        result.ready
      ) {
        const predictedKey =
          result.prediction;

        const predictedConfidence =
          Number(
            result.confidence_percent || 0
          );

        if (
          predictedKey &&
          predictedKey !== "unknown" &&
          SIGN_LIBRARY[predictedKey]
        ) {
          setDetectedKey(predictedKey);
          setConfidence(
            Math.round(
              predictedConfidence
            )
          );

          /*
            Optional automatic speech.
            We only speak after a fresh prediction
            when auto speak is enabled.
          */
          if (autoSpeak) {
            speakText(
              SIGN_LIBRARY[predictedKey].label,
              speechRate
            );
          }
        } else {
          setDetectedKey(null);
          setConfidence(0);
        }
      }
    } catch (error) {
      console.error(
        "ML prediction error:",
        error
      );
    } finally {
      predictionBusyRef.current = false;
    }
  }


  /* =======================================================
     START REAL ML SIGN RECOGNITION
     ======================================================= */

async function startRecognition() {
  if (!cameraOn) {
    alert("Start the camera first.");
    return;
  }

  /*
    Stop any previous recognition loop.
  */
  stopDetection();

  /*
    Start a new recognition session.
  */
  const sessionId =
    recognitionSessionRef.current;

  setRecognizing(true);

  setDetectedKey(null);
  setConfidence(0);

  /*
    IMPORTANT:
    Wait for the Python ML sequence to reset
    BEFORE sending new camera frames.

    Otherwise the reset request can arrive after
    the first frames and clear the new sequence.
  */
  try {
    await resetMLSequence();
  } catch (error) {
    console.error(
      "Could not reset ML sequence:",
      error
    );
  }

  /*
    Make sure recognition wasn't stopped while
    the reset request was running.
  */
  if (
    sessionId !==
    recognitionSessionRef.current
  ) {
    return;
  }

  /*
    Capture approximately 10 frames per second.

    The model needs 30 frames before prediction.
  */
  detectionTimerRef.current =
    window.setInterval(() => {
      predictCurrentFrame(sessionId);
    }, 100);

  /*
    Capture the first frame immediately.
  */
  predictCurrentFrame(sessionId);
}




  /* =======================================================
     ADD DETECTED SIGN TO CHAT
     ======================================================= */

  async function addDetectedToConversation() {
    if (!detectedSign) {
      return;
    }

    const messageData = {
      sender: "sign",
      type: "sign",
      text: detectedSign.label,
      sign: detectedKey,
      image: detectedSign.image,
    };

    try {
      const response = await fetch(
        `${API_URL}/conversation/message`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(messageData),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save detected sign"
        );
      }

      const result = await response.json();

      setMessages((current) => [
        ...current,
        result.data,
      ]);

      if (autoSpeak) {
        speakText(
          detectedSign.label,
          speechRate
        );
      }
    } catch (error) {
      console.error(
        "Detected sign error:",
        error
      );

      alert(
        "Could not add the detected sign to the conversation."
      );
    }
  }


  /* =======================================================
     CREATE SIGNS FROM TEXT
     ======================================================= */

  function createSignsFromText() {
    const sequence =
      getSignSequence(textInput);

    setSignSequence(sequence);
  }


  /* =======================================================
     SEND TEXT MESSAGE
     ======================================================= */

  async function sendTextMessage() {
    const text = textInput.trim();

    if (!text) {
      return;
    }

    const sequence =
      getSignSequence(text);

    setSignSequence(sequence);

    const messageData = {
      sender: "hearing",
      type: "text",
      text,
    };

    try {
      const response = await fetch(
        `${API_URL}/conversation/message`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(messageData),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to send message"
        );
      }

      const result = await response.json();

      setMessages((current) => [
        ...current,
        result.data,
      ]);

      if (autoSpeak) {
        speakText(text, speechRate);
      }

      setTextInput("");
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      alert(
        "Could not send the message. Please check your backend."
      );
    }
  }


  /* =======================================================
     SPEAK MESSAGE
     ======================================================= */

  function speakMessage(text) {
    const started =
      speakText(text, speechRate);

    setIsSpeaking(started);

    if (started) {
      window.setTimeout(
        () => setIsSpeaking(false),
        Math.max(
          1200,
          text.length * 55
        )
      );
    }
  }


  /* =======================================================
     START VOICE RECOGNITION
     ======================================================= */

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Try Chrome or Edge."
      );

      return;
    }

    stopListening();

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setListening(true);

      recognitionFinalRef.current = "";

      setLiveTranscript("");
    };

    recognition.onresult = (event) => {
      let finalText =
        recognitionFinalRef.current;

      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        const transcript =
          event.results[i][0].transcript;

        if (
          event.results[i].isFinal
        ) {
          finalText += `${transcript} `;
        } else {
          interimText += transcript;
        }
      }

      recognitionFinalRef.current =
        finalText;

      setLiveTranscript(
        `${finalText}${interimText}`.trim()
      );
    };

    recognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current =
      recognition;

    recognition.start();
  }


  /* =======================================================
     STOP VOICE RECOGNITION
     ======================================================= */

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error(error);
      }

      recognitionRef.current = null;
    }

    setListening(false);
  }


  /* =======================================================
     USE VOICE TRANSCRIPT
     ======================================================= */

  function useVoiceTranscript() {
    const transcript =
      liveTranscript.trim();

    if (!transcript) {
      return;
    }

    setTextInput(transcript);

    setSignSequence(
      getSignSequence(transcript)
    );

    stopListening();
  }


  /* =======================================================
     CLEAR CHAT
     ======================================================= */

  async function clearConversation() {
    try {
      const response = await fetch(
        `${API_URL}/conversation`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to clear conversation"
        );
      }

      setMessages([]);
    } catch (error) {
      console.error(
        "Clear conversation error:",
        error
      );

      alert(
        "Could not clear the conversation."
      );
    }
  }


  /* =======================================================
     PLAY SIGN SEQUENCE
     ======================================================= */

  function playSignSequence() {
    if (!signSequence.length) {
      return;
    }

    const words = signSequence
      .map((sign) => sign.label)
      .join(", ");

    speakMessage(words);
  }


  /* =======================================================
     QUICK PHRASE
     ======================================================= */

  function selectQuickPhrase(phrase) {
    setTextInput(phrase);

    const sequence =
      getSignSequence(phrase);

    setSignSequence(sequence);
  }


  return (
    <main className="communication-page">

      {/* ===================================================
          HERO
          =================================================== */}

      <section className="communication-hero">

        <div className="communication-hero-copy">

          <span className="communication-eyebrow">
            <Hand size={15} />
            REAL-TIME COMMUNICATION
          </span>

          <h1>
            Talk without{" "}
            <em>barriers.</em>
          </h1>

          <p>
            A two-way communication workspace
            that helps sign-language and hearing
            users communicate through signs, text,
            voice and speech.
          </p>

          <div className="communication-status-row">

            <span className="connection-pill">
              <span className="status-dot" />
              Communication ready
            </span>

            <span className="status-description">
              Indian Sign Language · English
            </span>

          </div>

        </div>


        <div className="communication-hero-card">

          <Sparkles size={18} />

          <strong>
            Two-way communication
          </strong>

          <span>
            Sign → text → speech
          </span>

          <span>
            Speech → text → signs
          </span>

        </div>

      </section>


      {/* ===================================================
          MAIN WORKSPACE
          =================================================== */}

      <section className="communication-workspace">

        <div className="workspace-main">

          {/* =================================================
              CAMERA
              ================================================= */}

          <section className="communication-panel camera-panel-new">

            <div className="panel-topline">

              <div>

                <span className="panel-kicker">
                  01 · SIGN TO TEXT
                </span>

                <h2>
                  Show your sign
                </h2>

              </div>

              <span
                className={`live-badge ${
                  cameraOn
                    ? "is-live"
                    : ""
                }`}
              >

                <span />

                {cameraOn
                  ? "LIVE"
                  : "CAMERA OFF"}

              </span>

            </div>


            <div className="camera-stage">

              {cameraOn ? (

                <>

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                  />

                  <div className="camera-overlay-top">

                    <span className="camera-live-dot" />

                    Camera active

                  </div>


                  <div className="camera-guide">

                    <span />
                    <span />
                    <span />
                    <span />

                  </div>


                  {recognizing && (

                    <div className="recognition-chip">

                      <span className="pulse-dot" />

                      Recognizing signs

                    </div>

                  )}

                </>

              ) : (

                <div className="camera-empty">

                  <div className="camera-empty-icon">

                    <Camera size={29} />

                  </div>

                  <h3>
                    Camera is ready
                  </h3>

                  <p>
                    Position your hands
                    inside the frame.
                    Start the camera to
                    begin communication.
                  </p>

                </div>

              )}

            </div>


            <div className="camera-controls-new">

              {!cameraOn ? (

                <button
                  className="dark-action"
                  onClick={startCamera}
                >

                  <Camera size={17} />

                  Start camera

                </button>

              ) : (

                <button
                  className="dark-action"
                  onClick={stopCamera}
                >

                  <CameraOff size={17} />

                  Stop camera

                </button>

              )}


              <button
                className="light-action"
                onClick={startRecognition}
                disabled={!cameraOn}
              >

                <Hand size={17} />

                {recognizing
                  ? "Recognizing…"
                  : "Recognize sign"}

              </button>

            </div>


            <p className="demo-disclaimer">

              Real-time recognition uses the trained
              SignBridge machine learning model.

            </p>

          </section>


          {/* =================================================
              DETECTED SIGN
              ================================================= */}

          <section className="communication-panel detected-panel-new">

            <div className="panel-topline">

              <div>

                <span className="panel-kicker">
                  02 · DETECTION
                </span>

                <h2>
                  What I understood
                </h2>

              </div>

              <Hand size={20} />

            </div>


            <div className="detected-result">

              {detectedSign ? (

                <>

                  <div className="detected-image-wrap">

                    <img
                      src={detectedSign.image}
                      alt={`${detectedSign.label} sign`}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>


                  <div className="detected-copy">

                    <span>
                      DETECTED SIGN
                    </span>

                    <strong>
                      {detectedSign.label}
                    </strong>

                    <div className="confidence-row">

                      <span>
                        Confidence
                      </span>

                      <b>
                        {confidence}%
                      </b>

                    </div>

                    <div className="confidence-bar">

                      <span
                        style={{
                          width: `${confidence}%`,
                        }}
                      />

                    </div>

                  </div>

                </>

              ) : (

                <div className="detected-placeholder">

                  <Hand size={34} />

                  <strong>
                    No sign detected yet
                  </strong>

                  <span>
                    Start the camera and
                    choose Recognize sign.
                  </span>

                </div>

              )}

            </div>


            <div className="detection-actions">

              <button
                className="dark-action full-action"
                onClick={
                  addDetectedToConversation
                }
                disabled={!detectedSign}
              >

                <Send size={16} />

                Add to conversation

              </button>


              <button
                className="light-action full-action"
                onClick={() =>
                  detectedSign &&
                  speakMessage(
                    detectedSign.label
                  )
                }
                disabled={!detectedSign}
              >

                {isSpeaking ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} />
                )}

                {isSpeaking
                  ? "Speaking…"
                  : "Speak detected sign"}

              </button>

            </div>

          </section>

        </div>


        {/* =================================================
            CONVERSATION
            ================================================= */}

        <aside className="communication-side">

          <section className="communication-panel conversation-panel">

            <div className="panel-topline">

              <div>

                <span className="panel-kicker">
                  03 · LIVE CHAT
                </span>

                <h2>
                  Conversation
                </h2>

              </div>

              <button
                className="light-action"
                onClick={clearConversation}
                title="Clear conversation"
              >

                <RotateCcw size={16} />

              </button>

            </div>


            <div className="conversation-meta">

              <span>
                {conversationLoading
                  ? "Loading..."
                  : messageCountLabel}
              </span>

              <span className="encrypted-pill">

                <Check size={11} />

                Local session

              </span>

            </div>


            <div className="conversation-messages">

              {conversationLoading ? (

                <div className="empty-conversation">

                  <Hand size={28} />

                  <strong>
                    Loading conversation
                  </strong>

                  <span>
                    Connecting to the
                    SignBridge server.
                  </span>

                </div>

              ) : conversationError ? (

                <div className="empty-conversation">

                  <Hand size={28} />

                  <strong>
                    Unable to connect
                  </strong>

                  <span>
                    {conversationError}
                  </span>

                </div>

              ) : messages.length === 0 ? (

                <div className="empty-conversation">

                  <Hand size={28} />

                  <strong>
                    Conversation cleared
                  </strong>

                  <span>
                    Your next message will
                    appear here.
                  </span>

                </div>

              ) : (

                messages.map((message) => (

                  <div
                    className={`message-row ${
                      message.role === "hearing" ||
                      message.sender === "hearing"
                        ? "me"
                        : "other"
                    }`}
                    key={message.id}
                  >

                    <div className="message-bubble">

                      <strong>
                        {message.role === "hearing" ||
                        message.sender === "hearing"
                          ? "You"
                          : "Sign user"}
                      </strong>

                      <div>
                        {message.text}
                      </div>


                      {(message.signKey ||
                        message.sign) &&
                        SIGN_LIBRARY[
                          message.signKey ||
                            message.sign
                        ] && (

                          <img
                            src={
                              SIGN_LIBRARY[
                                message.signKey ||
                                  message.sign
                              ].image
                            }
                            alt={
                              SIGN_LIBRARY[
                                message.signKey ||
                                  message.sign
                              ].label
                            }
                            style={{
                              width: "100%",
                              maxWidth: "150px",
                              height: "120px",
                              objectFit: "cover",
                              borderRadius: "12px",
                              marginTop: "10px",
                            }}
                          />

                        )}


                      <span className="message-meta">

                        {message.time ||
                          (
                            message.createdAt
                              ? new Date(
                                  message.createdAt
                                ).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "Just now"
                          )}

                      </span>

                      <div className="message-actions">

                        <button
                          onClick={() =>
                            speakMessage(
                              message.text
                            )
                          }
                          title="Listen"
                        >

                          <Volume2 size={13} />

                        </button>

                      </div>

                    </div>

                  </div>

                ))

              )}

            </div>


            {/* CHAT INPUT */}

            <div className="conversation-input">

              <div className="text-input-wrap">

                <input
                  type="text"
                  value={textInput}
                  onChange={(event) =>
                    setTextInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === "Enter"
                    ) {

                      event.preventDefault();

                      sendTextMessage();

                    }

                  }}
                  placeholder="Type a message..."
                />


                <button
                  onClick={() => {
                    createSignsFromText();
                  }}
                  title="Create signs"
                >

                  <Hand size={16} />

                </button>


                <button
                  onClick={sendTextMessage}
                  disabled={
                    !textInput.trim()
                  }
                  title="Send"
                >

                  <Send size={16} />

                </button>

              </div>


              <div className="conversation-tools">

                <button
                  onClick={
                    listening
                      ? stopListening
                      : startListening
                  }
                >

                  {listening ? (
                    <>
                      <MicOff size={13} />
                      Stop voice
                    </>
                  ) : (
                    <>
                      <Mic size={13} />
                      Speak
                    </>
                  )}

                </button>


                <button
                  onClick={() =>
                    speakMessage(textInput)
                  }
                  disabled={
                    !textInput.trim()
                  }
                >

                  <Volume2 size={13} />

                  Read aloud

                </button>

              </div>

            </div>

          </section>

        </aside>

      </section>


      {/* ===================================================
          SPEECH → SIGN
          =================================================== */}

      <section className="speech-sign-section">

        <div className="section-heading-new">

          <div>

            <span className="panel-kicker">
              04 · SPEECH TO SIGN
            </span>

            <h2>
              Let the other person speak normally.
            </h2>

          </div>

          <p>
            Speak naturally, review the transcript,
            then turn the sentence into a visual
            sign sequence.
          </p>

        </div>


        <div className="speech-workspace">

          {/* VOICE INPUT */}

          <div className="speech-input-card">

            <div className="speech-card-header">

              <span>
                VOICE INPUT
              </span>

              {listening && (

                <span className="listening-badge">

                  <span className="pulse-dot" />

                  Listening

                </span>

              )}

            </div>


            <div className="voice-button-area">

              <button
                className={`voice-main-button ${
                  listening
                    ? "is-listening"
                    : ""
                }`}
                onClick={
                  listening
                    ? stopListening
                    : startListening
                }
              >

                {listening ? (
                  <MicOff size={27} />
                ) : (
                  <Mic size={27} />
                )}

              </button>


              <strong>
                {listening
                  ? "Listening…"
                  : "Tap to speak"}
              </strong>

              <span>
                English (India)
              </span>

            </div>


            <div className="live-transcript">

              <span>
                LIVE TRANSCRIPT
              </span>

              <p>
                {liveTranscript ||
                  "Your spoken sentence will appear here as you speak."}
              </p>

            </div>


            <div className="speech-actions">

              <button
                className="dark-action"
                onClick={
                  useVoiceTranscript
                }
                disabled={
                  !liveTranscript.trim()
                }
              >

                <Check size={16} />

                Use transcript

              </button>


              <button
                className="light-action"
                onClick={stopListening}
                disabled={!listening}
              >

                <Square size={14} />

                Stop

              </button>

            </div>

          </div>


          {/* SIGN OUTPUT */}

          <div className="sign-output-card">

            <div className="speech-card-header">

              <span>
                SIGN SEQUENCE
              </span>

              <span>
                {signSequence.length} signs
              </span>

            </div>


            {signSequence.length > 0 ? (

              <>

                <div className="sign-sequence">

                  {signSequence.map(
                    (sign, index) => (

                      <div
                        className="sign-card"
                        key={`${sign.key}-${index}`}
                      >

                        <img
                          src={sign.image}
                          alt={`${sign.label} sign`}
                        />

                        <span>
                          {sign.label}
                        </span>

                      </div>

                    )
                  )}

                </div>


                <button
                  className="dark-action full-action"
                  onClick={
                    playSignSequence
                  }
                >

                  <Play size={15} />

                  Play sequence

                </button>

              </>

            ) : (

              <div className="sign-empty">

                <div>

                  <Hand size={27} />

                </div>

                <strong>
                  Your sign sequence
                  will appear here
                </strong>

                <span>
                  Type or speak a sentence
                  to generate signs.
                </span>

              </div>

            )}

          </div>

        </div>


        {/* =================================================
            QUICK PHRASES
            ================================================= */}

        <div className="quick-phrases">

          <div className="quick-phrases-heading">

            <Sparkles size={15} />

            <span>
              Quick phrases
            </span>

          </div>


          {[
            "Hello",
            "How are you?",
            "I need help",
            "I need a doctor",
            "I need water",
            "Thank you",
            "Please wait",
          ].map((phrase) => (

            <button
              key={phrase}
              onClick={() =>
                selectQuickPhrase(
                  phrase
                )
              }
            >

              {phrase}

            </button>

          ))}

        </div>

      </section>


      {/* ===================================================
          SETTINGS
          =================================================== */}

      <section className="communication-settings">

        <div className="settings-heading">

          <Settings2 size={18} />

          <div>

            <span className="panel-kicker">
              PREFERENCES
            </span>

            <h2>
              Communication settings
            </h2>

          </div>

        </div>


        <div className="settings-grid">

          <label className="setting-card">

            <div>

              <strong>
                Auto speak detected text
              </strong>

              <span>
                Read recognized signs aloud
                automatically.
              </span>

            </div>

            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(event) =>
                setAutoSpeak(
                  event.target.checked
                )
              }
            />

          </label>


          <div className="setting-card">

            <div>

              <strong>
                Speech speed
              </strong>

              <span>
                {speechRate.toFixed(2)}×
              </span>

            </div>

            <input
              className="speed-slider"
              type="range"
              min="0.6"
              max="1.4"
              step="0.05"
              value={speechRate}
              onChange={(event) =>
                setSpeechRate(
                  Number(
                    event.target.value
                  )
                )
              }
            />

          </div>


          <div className="setting-card">

            <div>

              <strong>
                Language
              </strong>

              <span>
                Voice and text recognition
              </span>

            </div>

            <button className="language-select">

              English (India)

              <ChevronDown size={14} />

            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

