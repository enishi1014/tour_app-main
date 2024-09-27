


var video = document.createElement("video");
var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");
var loadingMessage = document.getElementById("loadingMessage");
var outputContainer = document.getElementById("output");
var outputMessage = document.getElementById("outputMessage");
var outputData = document.getElementById("outputData");
var pointsDisplay = document.getElementById("points");
var stampsContainer = document.getElementById("stamps");



var storeList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']; // 店舗リスト


function loadInitialData() {
    fetch('/load_data')
        .then(response => {
            if (!response.ok) {
                throw new Error('サーバーからデータを取得できませんでした');
            }
            return response.json();
        })
        .then(data => {
            currentPoints = data.points || 0;
            visitedStores = data.stamps || {};
            createStampCard(); // スタンプカードを更新して表示
        })
        .catch(error => {
            console.error('初期データの読み込みに失敗しました:', error);
        });
}

loadInitialData();

function createStampCard() {
    stampsContainer.innerHTML = '';  // スタンプカードを初期化
    storeList.forEach(store => {
        var stamp = document.createElement('div');
        stamp.classList.add('stamp');
        stamp.innerText = store;

        // JSONから読み込んだスタンプ情報で、既に訪問済みの店舗にチェックを入れる
        if (visitedStores[store]) {
            stamp.classList.add('filled');
            stamp.innerText = '✔';  // 既に取得済みのスタンプにはチェック
        }
        stampsContainer.appendChild(stamp);
    });

    // ポイントの表示を更新
    pointsDisplay.innerText = currentPoints;
}


// カメラを起動してQRコードを読み取る
navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
    video.play();
    setTimeout(() => {
        requestAnimationFrame(tick);
    }, 200); // Wait 200ms for the video stream to stabilize
});
// 例: ボタンをクリックしてJSONファイルを保存
const saveJsonButton = document.createElement('button');
saveJsonButton.innerText = "JSONデータを保存";
saveJsonButton.onclick = saveToJsonFile;
document.body.appendChild(saveJsonButton);

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        loadingMessage.hidden = true;
        canvasElement.hidden = false;
        outputContainer.hidden = false;

        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            outputMessage.hidden = true;
            outputData.parentElement.hidden = false;
            outputData.innerText = `QRコードの情報: ${code.data}`;
            if (storeList.includes(code.data)) { // 認識したQRコードが店舗リスト内にある場合
                addPoint(code.data); // スタンプカードに追加
            }
        } else {
            outputMessage.hidden = false;
            outputData.parentElement.hidden = true;
        }
    }
    requestAnimationFrame(tick);
}


function addPoint(store) {
    if (!visitedStores[store]) {  // まだ訪問していない店舗なら
        visitedStores[store] = true;  // 訪問済みとして記録
        currentPoints += 10;  // ポイントを10追加
        createStampCard();  // スタンプカードを更新して表示

        // サーバーにデータを送信して保存
        fetch('/update_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                points: currentPoints,  // 現在のポイントを送信
                stamps: visitedStores  // 訪問済みのスタンプを送信
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log('データの保存に成功しました');
                }
            })
            .catch(error => {
                console.error('データの保存に失敗しました:', error);
            });
    }
}


