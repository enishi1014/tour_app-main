from flask import Flask, render_template, jsonify, request
import json
import requests
from flask_cors import CORS  # CORSのインポート
from flask_wtf.csrf import CSRFProtect
from flask import Flask, render_template, jsonify,url_for, redirect,request,session
import boto3
import math
import os
import json
from dotenv import load_dotenv

# .env ファイルから環境変数をロード
load_dotenv()

app = Flask(__name__)
app.secret_key = 'supersecretkey123!'
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
    if userid == 'admin' and password == '123':
        session['logged_in'] = True  # ログイン状態をセッションに保存
        return jsonify({"success": True, "message": "Login successful"})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401



# AWS SDK (Boto3) でのクライアント作成
client = boto3.client('location', region_name=os.getenv('AWS_REGION'))

# スポットデータのロード (JSONファイルから)
with open('static\data\model_courses.json', 'r', encoding='utf-8') as f:
    routes_data = json.load(f)

# スポットデータのロード (JSONファイルから)
with open('static\data\spots.json', 'r', encoding='utf-8') as f:
    spots_data = json.load(f)

@app.route('/')
def index():
    if not session.get('logged_in'):  # ログインしていない場合はログインページへ
        return redirect(url_for('login'))
    # ログイン済みの場合はindex.htmlを表示
    temples = {'point': 100}
    return render_template('index.html', routes=routes_data, temples=temples)


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

        response = client.calculate_route(
            CalculatorName=os.getenv('ROUTE_CALCULATOR_NAME'),
            DeparturePosition=spots[0],  # 出発地点
            DestinationPosition=spots[-1],  # 終点
            WaypointPositions=spots[1:-1],  # 中間地点
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
