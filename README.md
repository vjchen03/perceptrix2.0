# Perceptrix 
Perceptrix is a web application that helps users discover glasses frames that complement their face shape. Users upload a photo, the system analyzes facial landmarks, and the application recommends frames based on facial structure. The platform also includes a virtual try-on feature that allows users to preview frames on their face. 

**Live Demo:** https://perceptrix2.vercel.app/ 

## Research Poster 
The original product concept and design process for Perceptrix are summarized in the following research poster. 

![Research Poster](./public/Poster.png) 

## Features 
* User authentication with Firebase Authentication
* Image upload and storage using Firebase Storage
* Face shape analysis using MediaPipe Face Landmarker
* Frame recommendations based on facial structure
* Virtual try-on feature using TensorFlow Face Landmarks Detection

## Tech Stack 
* **Frontend:** JavaScript, HTML, CSS
* **Computer Vision:** MediaPipe Face Landmarker, TensorFlow Face Landmarks Detection
* **Backend Services:** Firebase Authentication, Firebase Storage
* **Design:** Figma
* **Deployment:** Vercel

## Architecture 
Perceptrix is a browser-based application that combines facial landmark detection with Firebase-based authentication and image storage.

### Application Flow 
1. A user signs up or logs in through Firebase Authentication
2. The user uploads a photo through the web interface
3. The uploaded image is stored in Firebase Storage
4. MediaPipe Face Landmarker analyzes facial landmarks
5. The system estimates facial structure and recommends frames
6. Users can preview frames through the virtual try-on interface powered by TensorFlow

## Running the Project Locally
**Clone the repository:**

  ```bash
  git clone https://github.com/vjchen03/perceptrix2.0.git
  cd perceptrix2.0
  ```

**Install dependencies:**

  ```bash
  npm install
  ```

**Run the development server:**

  ```bash
  npm run dev
  ```

**Build the application:**

  ```bash
  npm run build
  ```

**Preview the production build:**

  ```bash
  npm run preview
  ```
