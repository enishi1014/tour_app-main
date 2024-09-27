from flask import Flask, render_template, jsonify, request
import json
import requests
from flask_cors import CORS  # CORSのインポート
from flask_wtf.csrf import CSRFProtect
from flask import Flask, render_template, jsonify, request
import boto3
import math
import os
import json
from dotenv import load_dotenv



# .env ファイルから環境変数をロード
load_dotenv()

app = Flask(__name__)

# CORSを有効にする
CORS(app)

#?
@app.route('/api/login-info', methods=['POST'])
def login_info():
    # JavaScriptから送信されたデータを受け取る
    data = request.json
    print(f"Received data: {data}")
    
    userid = data.get('userid')
    password = data.get('password')
    
    # 仮のログインチェック（必要ならここでDB照合など）
    if userid == 'admin' and password == 'password123':
        return jsonify({"message": "Login successful"})
    else:
        return jsonify({"message": "Invalid credentials"}), 401


# AWS SDK (Boto3) でのクライアント作成
client = boto3.client('location', region_name=os.getenv('AWS_REGION'))

# スポットデータのロード (JSONファイルから)
with open('static\data\model_courses.json', 'r', encoding='utf-8') as f:
    routes_data = json.load(f)

    # スポットデータのロード (JSONファイルから)
with open('static\data\spots.json', 'r', encoding='utf-8') as f:
    spots_data = json.load(f)
    
# ハバーサインの公式による距離計算
def haversine_distance(coord1, coord2):
    R = 6371.0  # 地球の半径 (km)
    lat1, lon1 = math.radians(coord1[1]), math.radians(coord1[0])
    lat2, lon2 = math.radians(coord2[1]), math.radians(coord2[0])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

# 出発点を固定してスポットを並び替え
def sort_spots(start, spots):
    route = [start]
    remaining_spots = spots.copy()

    while remaining_spots:
        nearest_spot = min(remaining_spots, key=lambda spot: haversine_distance(route[-1], spot))
        route.append(nearest_spot)
        remaining_spots.remove(nearest_spot)

    return route

@app.route('/')

def index():
    # ダミーのポイントデータ
    temples = {'point': 100}
    return render_template('index.html',routes=routes_data, temples=temples)

# マップデータを提供するAPI

@app.route('/get-spots', methods=['GET'])
def get_spots():
    return jsonify(spots_data)

@app.route('/calculate-route', methods=['POST'])
def calculate_route():
    try:
        route_id = request.json.get('route_id')
        route = routes_data.get(route_id)

        if not route:
            return jsonify({'error': 'Invalid route ID'}), 400

        spots = route['spots']
        sorted_spots = sort_spots(spots[0], spots[1:-1])  # 出発点と中間地点を並び替え
        sorted_spots.append(spots[-1])  # 終点を追加

        response = client.calculate_route(
            CalculatorName=os.getenv('ROUTE_CALCULATOR_NAME'),
            DeparturePosition=sorted_spots[0],  # 出発地点
            DestinationPosition=sorted_spots[-1],  # 終点
            WaypointPositions=sorted_spots[1:-1],  # 中間地点
            IncludeLegGeometry=True
        )

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#画面遷移（QR）
@app.route('/qr_reader')
def qr_reader():
    return render_template('QR_JV.html')

#画面遷移（QR）
@app.route('/login')
def login():
    return render_template('login.html')
#画面遷移（NEW_Registration）
@app.route('/New_Registration')
def new_registration():
    return render_template('New_Registration.html')

#QR系のJSONファイル処理

# JSONファイルのパス
JSON_FILE = 'stamp_data.json'

# JSONファイルからデータを読み込む
def load_data():
    try:
        with open(JSON_FILE, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        # ファイルが存在しない場合の初期化
        data = {"points": 0, "stamps": {}}
    return data

# データをJSONファイルに保存する
def save_data(data):
    with open(JSON_FILE, 'w') as file:
        json.dump(data, file, indent=2)

# データを更新するルート
@app.route('/update_data', methods=['POST'])
def update_data():
    new_data = request.get_json()
    current_data = load_data()

    # ポイントとスタンプ情報の更新
    current_data['points'] = new_data.get('points', current_data['points'])
    current_data['stamps'].update(new_data.get('stamps', {}))

    # 更新されたデータを保存
    save_data(current_data)

    return jsonify({"status": "success"})

# データを読み込むルート
@app.route('/load_data', methods=['GET'])
def load_data_route():
    return jsonify(load_data())


if __name__ == '__main__':
    app.run(debug=True)