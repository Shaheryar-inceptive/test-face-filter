import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as faceapi from "face-api.js";

const FaceFilter = () => {
  const modelRef = useRef();
  useEffect(() => {
    const startFaceDetection = async () => {
      // Load face-api.js models
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

      // Set up Three.js scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
      renderer.setClearColor(0xf0f0f0);

      // Load 3D model
      const loader = new GLTFLoader();
      loader.load(
        `https://ishrostorage.blob.core.windows.net/container-3d/BAYCFaceARFinal.gltf`,
        (gltf) => {
          console.log(gltf);
          modelRef.current = gltf.scene;
          modelRef.current.position.set(0, 0, 0);
          scene.add(modelRef.current);
        },
        function (xhr) {},
        // called when loading has errors
        function (error) {
          console.log("An error happened", error);
        }
      );

      camera.position.z = 40;

      // Set up video element for face detection
      const video = document.createElement("video");
      document.body.appendChild(video);

      // Get user media for video stream
      navigator.mediaDevices.getUserMedia({ video: {} }).then((stream) => {
        video.srcObject = stream;
      });

      // Event listener for video play
      video.addEventListener("loadedmetadata", () => {
        video.play();
        console.log(video);
      });
      video.addEventListener("play", () => {
        // video.style.width = "1000px";
        // video.style.height = "1000px";
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.appendChild(canvas);

        const displaySize = {
          width: video.videoWidth,
          height: video.videoWidth,
        };
        faceapi.matchDimensions(canvas, displaySize);

        // Face detection loop
        setInterval(async () => {
          const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Resize and draw face landmarks
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

          // Update Three.js scene based on face detection results
          // (customize this part based on your specific use case)
          if (modelRef.current && resizedDetections.length > 0) {
            const faceLandmarks = resizedDetections[0].landmarks;
            const nose = faceLandmarks.getNose();
            const mouth = faceLandmarks.getMouth();
            const leftEye = faceLandmarks.getLeftEye();
            const RightEye = faceLandmarks.getRightEye();
            const jawline = faceLandmarks.getJawOutline();
            // console.log(faceLandmarks.getMouth());
            const nosePosition = new THREE.Vector3(
              resizedDetections[0]?.detection?._box?._x,
              resizedDetections[0]?.detection?._box?._y,
              modelRef.current.children[1].position?.z
            ); // Adjust 50 based on your scene
            const mouthPosition = new THREE.Vector3(
              mouth[2].x,
              mouth[2].y,
              -19
            ); // Adjust 50 based on your scene
            // console.log(resizedDetections);
            const leftEyePosition = new THREE.Vector3(0.2, 0.1, 50); // Adjust 50 based on your scene
            const rightEyePosition = new THREE.Vector3(
              RightEye[1].x,
              RightEye[1].y,
              50
            ); // Adjust 1 based on your scene
            // modelRef.current.traverse((child) => {
            //   if (child.isMesh) {
            //     const mesh = child;
            //     // Access morph targets
            //     if (mesh.morphTargetInfluences) {
            //       console.log(mesh);
            //       mesh.morphTargetInfluences[0] = 0.5; // Modify this value as needed
            //     }
            //   }
            // });
            // Set the position of the 3D model to the nose position
            // modelRef.current.children[0].position.copy(leftEyePosition);
            // modelRef.current.children[1].position.copy(rightEyePosition);
            // modelRef.current.children[2].position.copy(mouthPosition);
            // modelRef.current.children[4].position.copy(nosePosition);
            // modelRef.current.children[5].position.copy(nosePosition);
            modelRef.current.position.copy(nosePosition);

            // modelRef.current.children[0].morphTargetInfluences[0] = 0.5;
          }
          //   modelRef.current.children[0].scale = new THREE.Vector3(0.5, 0.4, 0.8);
          //   modelRef.current.children[0].position = new THREE.Vector3(
          //     0.5,
          //     0.4,
          //     0.8
          //   );
        }, 100);
        video.style.zIndex = "100000";
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        console.log(scene, modelRef);
        animate();

        // Animation loop for Three.js rendering
      });
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Adjust intensity and color
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Adjust intensity and color
      directionalLight.position.set(1, 1, 1).normalize();
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Set color to white

      scene.add(directionalLight);
    };

    startFaceDetection();
    return () => {
      modelRef.current = null;
    };
  }, []);

  return <div />;
};

export default FaceFilter;
