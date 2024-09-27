document.addEventListener('DOMContentLoaded', async function () {
    // マップ表示用のAPIキー
    const mapApiKey = "v1.public.eyJqdGkiOiIyYWQwZjQyZC0yMGYwLTQ4YjMtYjUzZi0xOGExOTNkYmUyMjgifU6af6Qz2TVFmHlhyA7gUEva5beeXEdF9d4qG_AGhh8qDtsswJARPgkK3M2MyPIaBBXOBsyeb0dbQkVqZrLRawRv7f_X_Wopago5eD85jDLG47Z-4BJScO95XkpWO5MwtN26mHIl0G-QaktNy8rs9tVpGxKeoqycjmJ_6FN6nU_PpTSatGpkWto4GLH1oLv3wZw_cRw3HgM9z7YsDy02-TQz9q3TRrAIKLIpRdpwvkKDtkubn-eFw1a9yrPXTuNmgjaTkCtQGekQkGZfkVNMy0J6KRSzzQBSx7WGvpjxJI2uE7sJap94BwvSYbM_9SLKzvP6rQr6_mLuIc50lzE24xI.ZTA2OTdiZTItNzgyYy00YWI5LWFmODQtZjdkYmJkODNkMmFh"; // マップ用のAPIキーに置き換える
    const mapName = "mymap";
    const mapRegion = "ap-southeast-2";

    // ルート計算用のAPIキー
    const routeApiKey = "v1.public.eyJqdGkiOiI0ZDhjNjIzYS04MmI2LTQ5M2MtYTg5Yy1mOTBhYTA2MDgwZDMifQSdAHIvgipgpQjkU9-AA60dfiy5xV3SPaObYWmyG2N13qnvSfioPEgIIvdDhlQa9SXi9fWTyid3JmNDX6k-oERVToACPMtiShr31cxQKDtmZCii_z7KisaQeln6acJBTbnoAcbufoCbJq_SFTTiC9ItVSghkD3IHL6s7v1ibs5ub_Bh9CbNO2wlHcjcLbjSHYmTU6tOkdInoIM6YAxktERiD9PcY6Cms3o_kP6-oEP4urJtZI8tGxUNzJICS_IDN0OImY4jNhvGNkzwuxN9AH8v7ve6vBpcBY91rz2mrGDofrGJ3huSWZPXWz4xyYmWzdY6J-9UZ5Age8PVCqxVLbQ.ZTA2OTdiZTItNzgyYy00YWI5LWFmODQtZjdkYmJkODNkMmFh"; // ルート計算用のAPIキーに置き換える
    const calculatorName = "MyRouteCalculator"; // 作成したルート計算機の名前に置き換える
    const routeRegion = "ap-southeast-2";

    // MapLibreのマップ表示の初期化
    const map = new maplibregl.Map({
        container: "map",
        style: `https://maps.geo.${mapRegion}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${mapApiKey}`,
        center: [139.6917, 35.6895],
        zoom: 11,
    });


    // 現在地を取得して表示する関数
    function showCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userCoords = [position.coords.longitude, position.coords.latitude];
                console.log('現在地:', userCoords);

                // 現在地にマーカーを追加
                new maplibregl.Marker({ color: "blue" })
                    .setLngLat(userCoords)
                    .setPopup(new maplibregl.Popup().setText('現在地'))
                    .addTo(map);

                // 地図の中心を現在地に移動
                map.setCenter(userCoords);
                map.setZoom(14);  // 現在地にズーム
            }, error => {
                console.error('現在地を取得できませんでした:', error);
            });
        } else {
            console.error('Geolocation APIがサポートされていません。');
        }
    }
    // ページ読み込み時に現在地を表示
    showCurrentLocation();

    // モデルコースデータの読み込み
    fetch('static/data/model_courses.json')
        .then(response => response.json())
        .then(data => {
            initializeCourseSelector(data);
        })
        .catch(error => console.error('モデルコースの読み込み中にエラーが発生しました:', error));

    // モデルコース選択メニューの初期化
    function initializeCourseSelector(courses) {
        const courseSelect = document.getElementById('course-select');

        // セレクトボックスにコースを追加
        courses.forEach((course, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });

        // コースが選択されたときのイベントリスナー
        courseSelect.addEventListener('change', function () {
            const selectedIndex = this.value;
            if (selectedIndex !== '') {
                const selectedCourse = courses[selectedIndex];
                displayCourse(selectedCourse);
            } else {
                removeCourse();
            }
        });
    }

    // ハンバーガーメニューのトグル関数
    function toggleMenu() {
        const menu = document.getElementById('menu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    }

    // 地図の初期化関数
    async function initializeMap() {
        const apiKey = "v1.public.eyJqdGkiOiIzODVjMGU5OS00NDI4LTQyZmMtOTY4ZS02OWVkYjI1Y2QxMWEifSYNGsUw2rs7pgeRhhpCtTFHWZw3xQpY4QxGIiAIoC6Uz62F6Y1YRhJ08z9B1HG7tdcLApNZqeK-mpXFGZJ3mcNliJRh_TeIvp5Ci8BZIr_qD9NJUXHSEoPqDTKAWD72QAMjvDl31aOhpcLI-0g8K-JmP8Zhb01fjblMmHVWFU-VtrEpJ__1JYLGAd0W42gC-0kJmWXucvfx4qR41-cxCN21zYUAUL6TBfvy1qRrKCkyJsP_qHIbl3otPSs1C08jHtOiac35ryRc91JrBfq2IB6maFJ6yAnL-WWRgJjYniA4zaOYhI-MtBrm18VahqbFGSriZtNpbHTdyReCZSQGym4.ZTA2OTdiZTItNzgyYy00YWI5LWFmODQtZjdkYmJkODNkMmFh";
        const mapName = "mymap";
        const region = "ap-southeast-2";

        const map = new maplibregl.Map({
            container: 'map',
            style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${apiKey}`,
            center: [139.767, 35.681],
            zoom: 11,
        });

        return map;
    }

    // ルート表示ボタンのイベントリスナー
    document.getElementById('load-route').addEventListener('click', async () => {
        const routeId = document.getElementById('route-select').value;

        try {
            const response = await fetch('/calculate-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ route_id: routeId }),
            });

            const routeData = await response.json();

            if (routeData.error) {
                console.error("Error fetching route:", routeData.error);
                return;
            }

            const map = await initializeMap();

            const route = routeData.Legs[0].Geometry.LineString;
            const geojson = {
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: route
                    },
                    properties: {}
                }]
            };

            map.on('load', function () {
                if (map.getSource("route-result")) {
                    map.getSource("route-result").setData(geojson);
                } else {
                    map.addSource("route-result", {
                        type: "geojson",
                        data: geojson
                    });
                    map.addLayer({
                        'id': "route-result",
                        'type': 'line',
                        'source': 'route-result',
                        'layout': {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        'paint': {
                            'line-color': '#FF0000',
                            'line-width': 10,
                            'line-opacity': 0.5
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error loading route:", error);
        }
    });

    let currentCourseLayerId = null;



}
);

// サーバーからスタンプとポイントのデータを取得する
function loadStampAndPoints() {
    fetch('/load_data')
        .then(response => response.json())
        .then(data => {
            const points = data.points || 0;
            const stamps = data.stamps || {};

            // ポイントを表示
            document.getElementById('points-display').textContent = `現在のポイント: ${points}`;

            // スタンプを更新
            for (let store in stamps) {
                if (stamps[store]) {
                    document.getElementById(`stamp-${store}`).classList.add('filled');
                }
            }
        })
        .catch(error => {
            console.error('ポイントとスタンプのデータの読み込みに失敗しました:', error);
        });
}

// ページ読み込み時にデータを取得して表示
window.onload = function () {
    loadStampAndPoints();
};

// ユーザー名はログイン情報から取得済みという前提
const loggedInUser = "ログイン中のユーザー"; // ここにログイン中のユーザー名が入る
function toggleMenu() {
    const menu = document.getElementById('menu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
    }
}
function postComment() {
    const comment = document.getElementById('comment').value;
    if (comment) {
        const commentList = document.getElementById('comment-list');
        const newComment = document.createElement('div');
        newComment.classList.add('comment');
        newComment.innerHTML = `<div class="username">${loggedInUser}</div><div>${comment}</div>`;
        commentList.appendChild(newComment);
        // コメント入力後にフォームをリセット
        document.getElementById('comment').value = '';
    } else {
        alert('コメントを入力してください');
    }
}
// ハンバーガーメニューの表示を制御
document.getElementById("hamburger-menu").addEventListener("click", function () {
    var menu = document.getElementById("menu");
    var closeBtn = document.getElementById("close-menu");
    menu.classList.toggle("active");
    closeBtn.style.display = "block"; // × ボタンを表示
});
document.getElementById("close-menu").addEventListener("click", function () {
    var menu = document.getElementById("menu");
    var closeBtn = document.getElementById("close-menu");
    menu.classList.toggle("active");
    menu.classList.remove("menu-open");  // メニューを非表示
    closeBtn.style.display = "none"; // × ボタンを非表示
});