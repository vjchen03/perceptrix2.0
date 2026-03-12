import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

// MediaPipe returns 468 landmarks.
function classifyFaceShape(landmarks) {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const leftJaw = landmarks[172];
  const rightJaw = landmarks[397];
  const chin = landmarks[152];
  const foreheadLeft = landmarks[103];
  const foreheadRight = landmarks[332];

  const cheekboneWidth = distance(leftCheek, rightCheek);
  const jawWidth = distance(leftJaw, rightJaw);
  const foreheadWidth = distance(foreheadLeft, foreheadRight);

  const faceCenterTop = midpoint(foreheadLeft, foreheadRight);
  const faceLength = distance(faceCenterTop, chin);

  const lengthToWidth = faceLength / cheekboneWidth;
  const jawToCheek = jawWidth / cheekboneWidth;
  const foreheadToCheek = foreheadWidth / cheekboneWidth;

  let faceShape = "Oval";

  if (lengthToWidth > 1.55) {
    if (jawToCheek > 0.93 && foreheadToCheek > 0.93) {
      faceShape = "Rectangle";
    } else {
      faceShape = "Oblong";
    }
  } else if (jawToCheek > 0.93 && foreheadToCheek > 0.93) {
    faceShape = "Square";
  } else if (foreheadToCheek > 1.0 && jawToCheek < 0.9) {
    faceShape = "Heart";
  } else if (cheekboneWidth > foreheadWidth && cheekboneWidth > jawWidth && lengthToWidth < 1.45) {
    faceShape = "Diamond";
  } else if (lengthToWidth < 1.35 && jawToCheek < 0.93) {
    faceShape = "Round";
  } else {
    faceShape = "Oval";
  }

  const features = {
    jawline:
      jawToCheek > 0.93
        ? "broad and structured"
        : "narrower and softer",
    cheekbones:
      cheekboneWidth >= foreheadWidth && cheekboneWidth >= jawWidth
        ? "the widest part of the face"
        : "balanced with the rest of the face",
    forehead:
      foreheadToCheek > 1.0
        ? "slightly wider than the cheekbones"
        : foreheadToCheek < 0.92
        ? "a bit narrower than the cheekbones"
        : "balanced in width",
    faceLength:
      lengthToWidth > 1.55
        ? "noticeably longer than wide"
        : lengthToWidth < 1.35
        ? "closer to as wide as it is long"
        : "moderately longer than wide",
  };

  const faceShapeInfo = {
    Oval: {
      summary:
        "Your face appears balanced with softly curved proportions. The forehead, cheekbones, and jawline look fairly harmonious.",
      recommendedFrames: ["Rectangular", "Square", "Aviator"],
      frameWhy:
        "Oval faces are balanced, so most frame shapes work well. Angular styles can add definition."
    },
    Round: {
      summary:
        "Your face appears softer and less angular, with fuller cheeks and a width and length that are relatively similar.",
      recommendedFrames: ["Rectangular", "Angular", "Cat-Eye"],
      frameWhy:
        "Angular frames add contrast and help create more definition for softer facial proportions."
    },
    Square: {
      summary:
        "Your face appears structured with a broad jawline and balanced width through the forehead and cheeks.",
      recommendedFrames: ["Round", "Oval", "Rimless"],
      frameWhy:
        "Softer frame shapes help balance stronger angles and a broader jawline."
    },
    heart: {
      summary:
        "Your face appears wider through the forehead and cheek area, tapering toward a narrower chin.",
      recommendedFrames: ["Oval", "Bottom-Heavy", "Rimless"],
      frameWhy:
        "These frames help balance a wider forehead and a narrower chin."
    },
    Diamond: {
      summary:
        "Your face appears widest at the cheekbones, with a narrower forehead and jawline.",
      recommendedFrames: ["Oval", "Cat-Eye", "Rimless"],
      frameWhy:
        "These styles complement wider cheekbones and narrower forehead and jaw proportions."
    },
    Oblong: {
      summary:
        "Your face appears longer than it is wide, with relatively even proportions and a softer elongated appearance.",
      recommendedFrames: ["Oversized", "Tall Frames", "Round"],
      frameWhy:
        "Deeper or taller frames help add balance to longer facial proportions."
    },
    Rectangle: {
      summary:
        "Your face appears longer than it is wide with straighter lines and a stronger jawline.",
      recommendedFrames: ["Round", "Oval", "Oversized"],
      frameWhy:
        "Softer or deeper frames help balance longer and more angular facial proportions."
    }
  };

  const info = faceShapeInfo[faceShape];

  return {
    faceShape,
    features,
    summary: info.summary,
    recommendedFrames: info.recommendedFrames,
    frameWhy: info.frameWhy
  };
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function LoadingPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const imageData = state?.imageData;
  const hasRun = useRef(false);

  useEffect(() => {
    if (!imageData || hasRun.current) return;

    hasRun.current = true;

    const analyzeFace = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
          },
          runningMode: "IMAGE",
          numFaces: 1,
        });

        const img = await loadImage(imageData);
        const result = faceLandmarker.detect(img);

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
          throw new Error("No face detected");
        }

        const landmarks = result.faceLandmarks[0];
        const analysis = classifyFaceShape(landmarks);

        navigate("/ai/results", {
          state: { imageData, analysis },
        });
      } catch (err) {
        console.error("Error analyzing face:", err);
        navigate("/ai/results", {
          state: {
            imageData,
            error: "We couldn't analyze this photo. Try a front-facing image with good lighting.",
          },
        });
      }
    };

    analyzeFace();
  }, [imageData, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.loadingCard}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
        </div>
        <h2 style={styles.title}>Analyzing Your Face</h2>
        <p style={styles.description}>
          We’re detecting facial landmarks and estimating your face shape...
        </p>
        <div style={styles.progressBar}>
          <div style={styles.progressFill}></div>
        </div>
        <p style={styles.tip}>
          This helps us recommend frames that match your proportions
        </p>

        {/* Spinner Keyframes */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes progress {
              0% { width: 10%; }
              50% { width: 70%; }
              100% { width: 90%; }
            }
          `}
        </style>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "2rem",
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  spinnerContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "4px solid rgba(91,75,255,0.1)",
    borderRadius: "50%",
    borderTop: "4px solid #5b4bff",
    animation: "spin 1s linear infinite",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#333",
    margin: "0 0 1rem 0",
  },
  description: {
    fontSize: "16px",
    color: "#666",
    margin: "0 0 2rem 0",
    lineHeight: "1.5",
  },
  progressBar: {
    height: "8px",
    backgroundColor: "#f0f0f0",
    borderRadius: "4px",
    overflow: "hidden",
    margin: "0 0 1.5rem 0",
  },
  progressFill: {
    height: "100%",
    width: "70%",
    backgroundColor: "#5b4bff",
    borderRadius: "4px",
    animation: "progress 2s ease-in-out infinite",
  },
  tip: {
    fontSize: "14px",
    color: "#888",
    margin: 0,
    fontStyle: "italic",
  },
};
