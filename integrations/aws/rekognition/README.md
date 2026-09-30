# IntelliPresence — AWS Rekognition Biometric Subsystem

This module handles **automated facial recognition attendance** and **biometric anti-spoofing** using AWS Rekognition Collections.

---

## 🏛️ Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │    AWS Rekognition Collection        │
                      │   ("intellipresence-faces-collection")│
                      └──────────────────▲───────────────────┘
                                         │ Vector Embeddings
                                         │ (Not Raw Photos)
   Student Enrollment Photo              │
 ─────────────────────────► [ FaceIndexer ]
   (Single face verification)            │
                                         │
   Classroom Group Capture               ▼
 ─────────────────────────► [ AttendanceDetector ] ──► Matches ──► Backend API / DB
   (Group crowd detection)                                         (Present / Absent)
```

---

## 🔑 Key Engineering & Interview Talking Points

1. **Vector Embeddings, Not Stored Images**:
   * We do **not** store sensitive student biometric face images directly in the recognition collection. AWS Rekognition extracts a 128/256-dimensional vector embedding of facial landmarks into an encrypted AWS collection, discarding the raw pixels.
   * `ExternalImageId` maps the vector ID directly to our database `student_id`.

2. **Cost & Performance Optimization**:
   * Instead of making $N$ pairwise face comparisons ($O(N)$ API calls), we use **AWS Rekognition Collections** (`search_faces_by_image`). A single API call searches an entire classroom photo against 10,000+ enrolled students in sub-second latency ($O(1)$ API request).
   * Group photos are capped at 100 faces per scan.

3. **Anti-Proxy Liveness Verification (`liveness_check.py`)**:
   * Validates **Head Pose** (`Pitch`, `Roll`, `Yaw` $\le 30^\circ$) to detect 2D flat paper or tablet screens angled towards the camera.
   * Inspects `Quality.Sharpness` ($\ge 40.0$) and `Quality.Brightness` ($30 \le B \le 90$) to reject re-photographed pixels.
   * Verifies `EyesOpen` with $\ge 80\%$ confidence.

---

## 💻 Code Files

| File | Purpose |
|---|---|
| [`face_indexer.py`](./face_indexer.py) | Creates Rekognition collection, indexes single-student enrollment embeddings. |
| [`attendance_detector.py`](./attendance_detector.py) | Detects all faces in a group photo and matches against the collection. |
| [`liveness_check.py`](./liveness_check.py) | Optical quality and anti-spoofing heuristic verification. |

---

## ⚙️ Environment Configuration

```bash
AWS_REGION=us-east-1
AWS_REKOGNITION_COLLECTION_ID=intellipresence-faces-collection
REKOGNITION_THRESHOLD=85.0
```
