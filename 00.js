/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/



// 이 프로그램의 가장 큰 목표는 window.stream 을  media recorder 로 받아서, 
// 녹음 중지하면 그때까지의 내용을 Blobs에 넣고, 그것을 recordedBlobs 에 넣는거다.
// 그것을 가지고 재생하고, 다운로드 한다



'use strict';

let mediaRecorder;  // 이거는 startRecording();에서, 실행될거다. 
                    // mediaRecorder = new MediaRecorder(window.stream, options); 로 정의되서 사용될거다.

let recordedBlobs;

// 이 부분은 mediaRecorder.ondataavailable = handleDataAvailable; 에 직접 코드 넣으면서 일단 주석처리헀음.
// function handleDataAvailable(event) { 
//   console.log('handleDataAvailable', event);
//   if (event.data && event.data.size > 0) {
//     recordedBlobs.push(event.data);
//   }
// }


// 녹음 버튼에 클릭 이벤트 설정 ( 녹음 시작, 녹음 중지 )
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    setTimeout(() => {     // 버튼이  start Recording 이 아니면. 즉 stop recording이면,
      mediaRecorder.stop();  // 버튼 클릭 후, 0.5초 뒤에 녹음정지. (진짜 누르자마자 stop 이면, 마지막이 약간 짤리는 느낌이라서)
    }, 500);
    // 하지만, 아래 내용은 0.5초 뒤가 아니고, 그냥 실행. 화면 표시되는 내용들.
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
});



// 재생 버튼에 클릭 이벤트 설정 
const playButton = document.querySelector('button#play');
const video2 = document.querySelector('video#video2');

playButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/webm'}); // recordedBlobs 를 버퍼에 넣는다.
  const url = window.URL.createObjectURL(blob);  // 객체를 가리키는 URL을 DOMString으로 반환한다.
  console.log(`blob객체의 url이 만들어졌다. ${url}`);

  video2.src = null;  
  // video2.srcObject = null;
  video2.src = url;
  video2.controls = true;
  video2.play();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);   //  취소(revoke)한다
    console.log(`blob객체의 url 이 지워졌다.`, url);
  }, 100);

});


// URL.revokeObjectURL();
// URL.revokeObjectURL(objectURL);





// 다운로드 버튼에 클릭 이벤트 설정
const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});  // recordedBlobs 를 버퍼에 넣는다
  const url = window.URL.createObjectURL(blob);   // 버퍼에 있는 blob 객체의 url 을 DOMString으로 반환한다.
  console.log(`blob객체의 url이 만들어졌다. ${url}`);

  const a = document.createElement('a');  // a 요소 만든다
  a.style.display = 'none';               // a 요소의 스타일 설정
  a.href = url;                           // a 요소의 url    설정
  a.download = 'test.webm';               // a 요소의 파일명 설정
  document.body.appendChild(a);           // a 요소를 body에 붙인다
  a.click();                              // a 요소를 클릭한다

  setTimeout(() => {
    document.body.removeChild(a);         //  삭제(remove)한다
    window.URL.revokeObjectURL(url);      //  취소(revoke)한다
    console.log(`blob객체의 url 이 지워졌다.`, url);
  }, 100);

});






function startRecording() {

  recordedBlobs = [];
  
  // mimeType 을 설정한다
  let options = {mimeType: 'video/webm;codecs=vp9,opus'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not supported`);
    options = {mimeType: 'video/webm;codecs=vp8,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not supported`);
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: ''};
      }
    }
  }


  try {
    mediaRecorder = new MediaRecorder(window.stream, options);  // 정해진 mimeType의 stream 을 mediaRecorder 에..
 
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }


  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);


  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;

  mediaRecorder.start();
  console.log('MediaRecorder started', mediaRecorder);

  setTimeout(() => {     // 녹음이 최대길이 설정.  몇초뒤 중지되도록 설정. mediaRecorder.onstop 이벤트가 발생한다.
    if (recordButton.textContent === 'Start Recording') {
      console.log('정해진 최대 녹음시간 이전에 이미 정지되었음');
    } else {
      mediaRecorder.stop();
      recordButton.textContent = 'Start Recording';
      playButton.disabled = false;
      downloadButton.disabled = false;
    }
  }, 10000);
    
  
  
  
  // 이 stop 이벤트는  MediaRecorder.stop()메서드 호출되거나, 또는 캡처중인 미디어 스트림이 종료 될 때 발생한다.
  // 각각의 경우에, Blob 이 해당 지점까지 캡처하게하면서 dataavailable event 가 발생한 후,  stop 이벤트가 발생한다.
  // 즉, stop전에 dataavailable 가 생기는데, Blob 이 그때까지를 캡쳐하기하기위함이라느 뜻.
  mediaRecorder.onstop = (event) => {                // 녹음되는 stram 이 stop되면...
    console.log('Recorder stopped: ', event);        // 콘솔에 표시한다...
    console.log('Recorded Blobs: ', recordedBlobs);  // 콘솔에 표시한다...
  };

  // mediaRecorder.ondataavailable = handleDataAvailable;  // 녹음되는 stream 에 ondataavailable 이 발생하면...
  mediaRecorder.ondataavailable = (event)=>{ // 녹음이 중지되기 전에 발생하는 이벤트다. 이거 발생하면.
    recordedBlobs.push(event.data);          // 그때 까지의 data 를 recordedBlobs 에 넣는다.
  };  // 녹음되는 stram 에 ondataavailable

}




document.querySelector('button#start').addEventListener('click', async () => {
  const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
  const constraints = {
    audio: { 
      echoCancellation: {exact: hasEchoCancellation},
      noiseSuppression: true,
      sampleSize: 8,
      sampleRate: 1000, // 8000, 11025, 22050, 44100
      channelCount: 1  // 1 mono, 2 stereo
      },
    // video: false
    video: { width: 1280, height: 720 }
    // 
    // video: {
    //   width: { min: 1024, ideal: 1280, max: 1920 },
    //   height: { min: 576, ideal: 720, max: 1080 }
    // }
  };

  // console.log('Using media constraints:', constraints);
  await getMedia(constraints);
});



 async function getMedia(constraints) {

  try {
    recordButton.disabled = false;  // 녹화버튼이 비활성 상태라 클릭안되던거를, 클릭가능한상태로  활성화 한다

    //-------------------------------------------------------------------------
    // 아주 아래쪽에 설명한 MediaDevices.getUserMedia() 사용법을 봐라.
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('getUserMedia() got stream:', stream);

    //-------------------------------------------------------------------------
    // 녹음된 화면용.. 이거 지우면 녹화정지 안된다. 클릭 안된다 ( 활성화도 되어있다 )
    window.stream = stream;  // 이거는 startRecording() 의 try 부분에서 
                             // 이렇게 쓰인다. mediaRecorder = new MediaRecorder(window.stream, options);
    //-------------------------------------------------------------------------
    // 이 부분은 항상 나오는 왼쪽화면 보이는거.. 이거 모두 삭제해도 녹음하는거랑 상관없다
    const video1 = document.querySelector('video#video1'); // 브라우저에서 video 가 들어갈 부분을 선택해서.
    if ('srcObject' in video1) {
      video1.srcObject = stream;
      // MediaStream 을 비디오1 이 들어갈 부분에 srcObject 에 다이렉트로 set 헀다
      // srcObject 는  MediaStream, MediaSource, Blob 또는 File 객체를 값으로 받는다
    } else {
      // Avoid using this in new browsers, as it is going away.
      video1.src = URL.createObjectURL(stream); // 구형 브라우저를 위한것. 전엔 이렇게 했다
    }
    //-------------------------------------------------------------------------   

  } catch (e) {
    // console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}





// MediaDevices.getUserMedia() 사용법
// 
// MediaDevices 인터페이스의 getUserMedia() 메서드는 사용자에게 
// 미디어 입력장치 "사용권한을 요청" 하며, 
// 사용자가 수락하면 요청한 미디어 종류의 트랙을 포함한 "MediaStream (en-US)을 반환" 합니다. 
// 
// 스트림은 카메라, 비디오 녹화 장치, 스크린 공유 장치 등 하드웨어와 
// 가장 비디오 소스가 생성하는 비디오 트랙과, 마이크, A/D 변환기 등 물리적과 
// 가상 오디오 장치가 생성하는 오디오 스트림, 그리고 그 외의 다른 종류의 스트림을 포함할 수 있습니다.
// 
// 반환하는 값은 MediaStream (en-US) 객체로 이행하는 Promise입니다. 사용자가 권한 요청을 거부했거나 일치하는 유형의 미디어를 사용할 수 없는 경우, 프로미스는 각각 NonAllowedError와 NotFoundError로 거부합니다.
// 참고: 사용자가 권한 요청에 대한 선택을 하지 않고 완전히 무시할 수도 있기 때문에, 프로미스 또한 이행도 거부도 하지 않을 수 있습니다.
// 보통, MediaDevices 싱글톤 객체는 다음과 같이 navigator.mediaDevices를 사용해 접근합니다.
// 
// async function getMedia(constraints) {
//   let mediaStream = null;
//   try {
//     mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
//     /* 스트림 사용 */  이 부분에 아래에 설명한 MediaStream 부분이 들어간다
//   } catch(err) {
//     /* 오류 처리 */
//   }
// }
//
// https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/getUserMedia



// ==============================================================================
// 이 예에서는, "카메라에서 오는 MediaStream" 이 --> 새로 생성된 <video> 요소에 할당됩니다.
// 
// const mediaStream = await navigator.mediaDevices.getUserMedia({video: true});
// const video = document.createElement('video');
// video.srcObject = mediaStream;
// ==============================================================================

// ==============================================================================
// 이것은, 예전 브라우저를 위한 것이다. (예전브라우저를 위한 fallback을 가지고 할당된다 )
// 
// const mediaStream = await navigator.mediaDevices.getUserMedia({video: true});
// const video = document.createElement('video');
// if ('srcObject' in video) {
//   video.srcObject = mediaStream;  // <--- 지금은 ( As of March 2020 ) 이렇게 직접 가능. 사파리는 안됨.
// } else {
//   // Avoid using this in new browsers, as it is going away.
//   video.src = URL.createObjectURL(mediaStream);  // <--- 예전엔 이렇게 URL 만들고 할당했다고 함.
// }
//
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/srcObject
// ==============================================================================



// ==============================================================================
// 이 예에서,  "new MediaSource" 가 --> 새로 생성된 <video> 요소에 할당됩니다 .
// 
// const mediaSource = new MediaSource();
// const video = document.createElement('video');
// video.srcObject = mediaSource;
// ==============================================================================