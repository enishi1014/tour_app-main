document.addEventListener('DOMContentLoaded', async function () {
    const mapApiKey = "v1.public.eyJqdGkiOiIyYWQwZjQyZC0yMGYwLTQ4YjMtYjUzZi0xOGExOTNkYmUyMjgifU6af6Qz2TVFmHlhyA7gUEva5beeXEdF9d4qG_AGhh8qDtsswJARPgkK3M2MyPIaBBXOBsyeb0dbQkVqZrLRawRv7f_X_Wopago5eD85jDLG47Z-4BJScO95XkpWO5MwtN26mHIl0G-QaktNy8rs9tVpGxKeoqycjmJ_6FN6nU_PpTSatGpkWto4GLH1oLv3wZw_cRw3HgM9z7YsDy02-TQz9q3TRrAIKLIpRdpwvkKDtkubn-eFw1a9yrPXTuNmgjaTkCtQGekQkGZfkVNMy0J6KRSzzQBSx7WGvpjxJI2uE7sJap94BwvSYbM_9SLKzvP6rQr6_mLuIc50lzE24xI.ZTA2OTdiZTItNzgyYy00YWI5LWFmODQtZjdkYmJkODNkMmFh";
    const mapName = "mymap";
    const mapRegion = "ap-southeast-2";

    // 鞆の浦周辺の緯度経度範囲を設定
    const bounds = [
        [133.3550, 34.3762], // 南西座標 (SW)
        [133.4050, 34.3900]  // 北東座標 (NE)
    ];

    // MapLibreのマップ表示の初期化（boundsオプションを使用）
    const map = new maplibregl.Map({
        container: "map",
        style: `https://maps.geo.${mapRegion}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor?key=${mapApiKey}`,
        center: [133.381502, 34.382515],  // 鞆の浦の中心
        zoom: 16,
        //maxBounds: bounds  // マップの移動範囲を鞆の浦周辺に制限
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
                //map.setCenter(userCoords);
                //map.setZoom(14);  // 現在地にズーム
            }, error => {
                console.error('現在地を取得できませんでした:', error);
            });
        } else {
            console.error('Geolocation APIがサポートされていません。');
        }
    }
    showCurrentLocation();
    // ズームアウトを制限して、ユーザーが範囲外のエリアを見ることができないようにする
    map.setMaxZoom(18);  // 最大ズームレベル
    map.setMinZoom(8);  // 最小ズームレベル

    // マップのナビゲーションコントロールを追加
    map.addControl(new maplibregl.NavigationControl());

    // スポットを追加する関数
    async function addSpotsToMap() {
        const response = await fetch('/get-spots');
        const data = await response.json();
        const spots = data.spots;

        spots.forEach(spot => {
            const marker = new maplibregl.Marker({
                element: createCustomMarker(spot.type),  // カスタムアイコン
                anchor: 'bottom'
            })
            .setLngLat([spot.longitude, spot.latitude])
            .addTo(map);

            const popup = new maplibregl.Popup({ offset: 25 })
                .setHTML(`<h3>${spot.name}</h3><p>${spot.details}</p>`);
            marker.getElement().addEventListener('mouseenter', () => {
                popup.addTo(map).setLngLat([spot.longitude, spot.latitude]);
            });
            marker.getElement().addEventListener('mouseleave', () => {
                popup.remove();
            });
        });
    }

    // カスタムマーカーを作成
    function createCustomMarker(type) {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(/static/icons/${type}-icon.png)`;
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.backgroundSize = '100%';
        return el;
    }

    // スポットを地図に追加
    addSpotsToMap();

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

            // 既存のマップにルートを追加または更新
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
        } catch (error) {
            console.error("Error loading route:", error);
        }
    });
    let currentCourseLayerId = null;

    // ここから大槻
    // コメントとマーカーを追加する関数
    function addCommentMarker() {

        const comment = document.getElementById('comment').value;
        if (!comment) {
            alert("コメントを入力してください。");
            return;
        }
        const radios = document.getElementsByName('comment_type');
        // ラジオボタンが選択されているか確認
        let selectedValue = null;
        // 選択されたラジオボタンを探す
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                selectedValue = radios[i].value;
                break;
            }
        }
        if (selectedValue === null) {
            alert("良いコメントか悪いコメントか選択してください。");
            return;
        }

        // 現在地を取得
        navigator.geolocation.getCurrentPosition(position => {
            const userCoords = [position.coords.longitude, position.coords.latitude];
            const loggedInUser = "{{ username }}";  // ログイン中のユーザー名をFlaskから取得(未完成)
            // 現在地にマーカーを追加(未完成，データベースにコメントを登録)
            if(selectedValue=="good"){
                // ここから颯太さん（リアルタイムコメント表示）
                const commentList = document.getElementById('comment-list');
                const newComment = document.createElement('div');
                newComment.classList.add('comment');
                // loggedInUserはログインしているユーザ名
                newComment.innerHTML = `<div class="username">${loggedInUser}</div><div>${comment}</div>`;
                commentList.appendChild(newComment);
                // ここまで颯太さん（これ以降でマップに表示）
                const marker = new maplibregl.Marker({ color: "red" })  // 赤いマーカーを表示
                .setLngLat(userCoords)  // 指定された位置にマーカーを設定
                .addTo(map);  // マーカーをマップに追加

                // ポップアップを作成し、マーカーに追加
                const popup = new maplibregl.Popup({ closeOnClick: false })  // クリックで閉じないように設定
                    .setText(comment)  // ポップアップにコメントを設定
                    .setLngLat(userCoords)  // ポップアップの位置をマーカーの位置に設定
                    .addTo(map);  // ポップアップをマップに追加

                // マーカーとポップアップを関連付ける
                marker.setPopup(popup);  // マーカーにポップアップを関連付ける

                // コメント入力欄をクリア
                document.getElementById("comment").value = "";
            }
            // 悪いコメントの場合はDBに保存のみ(未完成，データベースにコメントを登録)
            else{
                document.getElementById("comment").value = "";
                return;
            }
        }, error => {
            console.error('現在地を取得できませんでした:', error);
        });
    }
    

    document.getElementById("add-comment").addEventListener("click", addCommentMarker, false);
    // ここまで大槻
    // ここから颯太さん
    });

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
    // function postComment() {
    //     const comment = document.getElementById('comment').value;
    //     if (comment) {
    //         const commentList = document.getElementById('comment-list');
    //         const newComment = document.createElement('div');
    //         newComment.classList.add('comment');
    //         newComment.innerHTML = `<div class="username">${loggedInUser}</div><div>${comment}</div>`;
    //         commentList.appendChild(newComment);
    //         // コメント入力後にフォームをリセット
    //         document.getElementById('comment').value = '';
    //     } else {
    //         alert('コメントを入力してください');
    //     }
    // }
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

