from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

#base endpoint
@app.route('/')
def home():
    return render_template('index.html')


#endpoint to grab doctor's list json file (json file generated with the help of faker library in separate python script)
@app.route('/api/doctors', methods=['GET'])
def get_doctors():

    with open(os.path.join('data', 'doctors.json'), 'r') as file:
        doctors = json.load(file)
    return jsonify(doctors)


if __name__ == '__main__':
    app.run(debug=True)
