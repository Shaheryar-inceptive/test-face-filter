import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as faceapi from "face-api.js";
import "./face.css";
import { useGLTF } from "@react-three/drei";
const FaceFilter = (props) => {
  const modelRef = useRef();
  const modelContainerRef = useRef();
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
      const renderer = new THREE.WebGLRenderer({ alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.position = "absolute"; // Transparent background color
      renderer.domElement.style.top = "0px"; // Transparent background color

      // Load 3D model
      const loader = new GLTFLoader();
      loader.load(
        `https://ishrostorage.blob.core.windows.net/container-3d/BAYCFaceARFinal.gltf`,
        (gltf) => {
          console.log(gltf);
          modelRef.current = gltf.scene;
          scene.add(modelRef.current);
          modelContainerRef.current.appendChild(modelRef.current);
        },
        function (xhr) {},
        // called when loading has errors
        function (error) {
          console.log("An error happened", error);
        }
      );

      camera.position.z = 45;

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
      let basePointX = null;
      let basePointY = null;
      video.addEventListener("play", () => {
        video.style.width = `${window.innerWidth}px`;
        video.style.height = `${window.innerHeight}px`;
        // const canvas = faceapi.createCanvasFromMedia(video);
        // canvas.classList.add("modelCanvas");
        // document.body.appendChild(canvas);
        renderer.domElement.style.width = `${window.innerWidth}px`; // Transparent background color
        renderer.domElement.style.height = `${window.innerHeight}px`; // Transparent background color
        const displaySize = {
          width: video.videoWidth,
          height: video.videoWidth,
        };
        // faceapi.matchDimensions(canvas, displaySize);
        document.body.appendChild(renderer.domElement);

        // Face detection loop
        // Initialize an array to store the last few positions

        // Face detection loop
        let prevFacePosition = new THREE.Vector3();

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

          if (modelContainerRef.current && resizedDetections.length > 0) {
            const faceLandmarks = resizedDetections[0].landmarks;
            const nose = faceLandmarks.getMouth();
            const currentFacePosition = new THREE.Vector3(
              nose[0].x,
              nose[0].y,
              0
            ); // Adjust 50 based on your scene
            const leftEye = faceLandmarks.getLeftEye()[0];
            const rightEye = faceLandmarks.getRightEye()[0];

            // Calculate the rotation angle based on the positions of the eyes
            const deltaY = rightEye.y - leftEye.y;
            const deltaX = rightEye.x - leftEye.x;
            const rotationAngle = Math.atan2(deltaY, deltaX);

            // Convert rotation angle from radians to degrees

            // Set the rotation of the model
            modelRef.current.rotation.z = rotationAngle;
            // Calculate the difference between current and previous positions
            const diffPosition = currentFacePosition
              .clone()
              .sub(prevFacePosition);
            console.log(faceLandmarks);
            // If this is not the first loop, apply the difference to the model's position
            if (prevFacePosition.x !== 0 && prevFacePosition.y !== 0) {
              modelRef.current.position.add(diffPosition);
              //   modelRef.current.rotation.add(diffPosition);
            }

            // Update the previous position for the next loop
            prevFacePosition = currentFacePosition.clone();
          }
        }, 100);

        console.log(scene, modelRef);
        video.style.zIndex = "1";
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
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
  const { nodes, materials } = useGLTF(
    "https://ishrostorage.blob.core.windows.net/container-3d/BAYCFaceARFinal.gltf"
  );
  console.log(nodes, materials);
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Eye_L.geometry}
        material={materials.Eyes}
        position={[4.353, 6.967, 6.312]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Eye_R.geometry}
        material={materials.Eyes}
        position={[-4.353, 6.967, 6.312]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cap.geometry}
        material={materials.Zeebra_Line_Tshirt_Ape_Cap_n_Spects1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Head.geometry}
        material={materials.BodyZebraApe}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Teeth_Upper.geometry}
        material={materials.MouthSet}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Tongue.geometry}
        material={materials.MouthSet}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Teeth_Lower.geometry}
        material={materials.MouthSet}
      />
    </group>
  );
};

export default FaceFilter;
