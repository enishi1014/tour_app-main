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
        center: [133.37985, 34.38368],  // 鞆の浦の中心
        zoom: 14,
        maxBounds: bounds  // マップの移動範囲を鞆の浦周辺に制限
    });

    // ズームアウトを制限して、ユーザーが範囲外のエリアを見ることができないようにする
    map.setMaxZoom(18);  // 最大ズームレベル
    map.setMinZoom(13);  // 最小ズームレベル

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
});
