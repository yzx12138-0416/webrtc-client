const videoElement = document.getElementById('remoteVideo');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// 设置 canvas 尺寸与视频相同
canvas.width = videoElement.videoWidth;
canvas.height = videoElement.videoHeight;

// 每帧捕获视频并发送到 Unity
function updateFrame() {
    // 将视频帧绘制到 canvas 上
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // 将 canvas 转为 Base64 编码的 JPEG 图像
    const frameData = canvas.toDataURL('image/jpeg');

    // 将图像数据传递给 Unity
    unityInstance.SendMessage("WebRTCStreamReceiver", "SetTextureFromWeb", frameData);

    // 继续每帧更新
    requestAnimationFrame(updateFrame);
}

// 启动视频帧更新
updateFrame();
