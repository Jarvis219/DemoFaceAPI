const video = document.querySelector('#videoCam');

const loadFaceAPI = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('./models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('./models');
  await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
  await faceapi.nets.faceExpressionNet.loadFromUri('./models');
  await faceapi.nets.ageGenderNet.loadFromUri('./models');
};

const loadImage = async () => {
  const names = ['Quang'];

  return Promise.all(
    names.map(async (name) => {
      const faceDesc = [];
      for (let i = 1; i < 3; i++) {
        const img = await faceapi.fetchImage(
          // `./images/${name}/${name}${i}.png`
          `https://firebasestorage.googleapis.com/v0/b/datn-spa.appspot.com/o/images%2F${name}${i}.png?alt=media`
        );
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        faceDesc.push(detection.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(name, faceDesc);
    })
  );
};

const getCamera = () => {
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: {} }).then((camera) => {
      video.srcObject = camera;
    });
  }
};

video.addEventListener('playing', async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById('bodyVideo').append(canvas);

  const displaySize = {
    width: video.videoWidth,
    height: video.videoHeight,
  };
  setInterval(async () => {
    const detects = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()
      .withFaceDescriptors();
    const resizeDetector = faceapi.resizeResults(detects, displaySize);
    canvas
      .getContext('2d')
      .clearRect(0, 0, displaySize.width, displaySize.height);

    // await faceapi.draw.drawDetections(canvas, resizeDetector);
    // await faceapi.draw.drawFaceExpressions(canvas, resizeDetector);
    const labeledFaceDescriptors = await loadImage();

    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.7);
    const results = resizeDetector.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );
    results.forEach(async (result, i) => {
      const box = resizeDetector[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      // console.log(result.toString());
      // await faceapi.draw.drawFaceLandmarks(canvas, resizeDetector);
      drawBox.draw(canvas);
    });
  }, 3000);
});

loadFaceAPI().then(getCamera);
