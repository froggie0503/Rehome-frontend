var captcha;
var sessionId;

async function genNewCaptcha() {
  // create random 6-digit captcha
  captcha = '';
  for (var i = 0; i < 6; i++) {
    captcha += Math.floor(Math.random() * 10);
  }

  await storeCaptchaToBackend(captcha);

  // render on available canvases
  renderCaptcha("captchaCanvas");
  renderCaptcha("captchaCanvasModal");
}

// store captcha on backend and get sessionId
async function storeCaptchaToBackend(captchaCode) {
  try {
    const response = await fetch('http://localhost:8080/api/mem/captcha/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ captcha: captchaCode })
    });

    const result = await response.json();
    if (result.success) {
      // ApiResponse 的資料放在 result.data
      sessionId = result.data && result.data.sessionId ? result.data.sessionId : null;
      console.log('Captcha stored, sessionId:', sessionId);
      if (!sessionId) {
        console.error('captcha store 回傳格式異常，缺少 sessionId', result);
      }
    }
  } catch (error) {
    console.error('Failed to store captcha', error);
  }
}

// draw captcha on canvas
function renderCaptcha(canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) {
    return;
  }
  var ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = "#e6dfd7ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // noise lines
  for (var i = 0; i < 3; i++) {
    ctx.strokeStyle = getRandomColor();
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // captcha characters
  for (var j = 0; j < captcha.length; j++) {
    ctx.font = (20 + Math.random() * 10) + "px Arial";
    ctx.fillStyle = getRandomColor();
    ctx.textBaseline = "middle";

    var angle = (Math.random() - 0.5) * 0.4;
    var x = 20 + j * 25;
    var y = canvas.height / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillText(captcha[j], 0, 0);
    ctx.restore();
  }

  // noise dots
  for (var k = 0; k < 30; k++) {
    ctx.fillStyle = getRandomColor();
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
    ctx.fill();
  }
}

function getRandomColor() {
  var r = Math.floor(Math.random() * 150);
  var g = Math.floor(Math.random() * 150);
  var b = Math.floor(Math.random() * 150);
  return "rgb(" + r + "," + g + "," + b + ")";
}

function checkCaptcha() {
  var check = document.getElementById("repasswd_VerificationCode").value;
  if (captcha == check) {
    // alert("Valid Captcha!!! Success");
    document.getElementById("repasswd_VerificationCode").value = "";
  } else {
    // alert("InValid Captcha!!! Please Try Again");
    document.getElementById("repasswd_VerificationCode").value = "";
  }
}

// initial generation
genNewCaptcha();

window.getCaptchaSessionId = function() {
  return sessionId;
};
