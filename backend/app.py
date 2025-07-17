from chain_ensembles import LLMChain
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
from chain_ensembles.hf_link import HuggingFaceLink
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    T5ForConditionalGeneration,
    BitsAndBytesConfig,
)
import io
import uuid
import os
import shutil

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # Enable CORS for React frontend

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

@app.route('/upload', methods=['POST'])
def upload_file():
    print("Starting file upload process.")
    if 'csvFile' not in request.files:
        print("No file in request.")
        return jsonify({"error": "No file provided"}), 400

    csv_file = request.files['csvFile']
    if not csv_file.filename.endswith('.csv'):
        print("Invalid file type.")
        return jsonify({"error": "Only CSV files are allowed"}), 400

    token_input = request.form.get('hfToken')
    model_names = request.form.getlist('modelNames')
    confidence_scores = request.form.getlist('confidenceScores')

    if not token_input:
        print("HuggingFace token is missing.")
        return jsonify({"error": "HuggingFace token is required"}), 400

    if not model_names:
        print("No models selected.")
        return jsonify({"error": "At least one model must be selected."}), 400

    confidence_scores = [float(score) if score else 0.0 for score in confidence_scores]

    try:
        data = pd.read_csv(csv_file)
        if data.empty:
            print("Uploaded CSV is empty.")
            return jsonify({'error': 'Uploaded CSV is empty.'}), 400

        required_columns = {'Tweet', 'Target'}
        if not required_columns.issubset(data.columns):
            print("Missing required columns.")
            return jsonify({'error': f'CSV must contain columns: {", ".join(required_columns)}'}), 400

        prompts = []
        for _, row in data.iterrows():
            tweet = row['Tweet']
            target = row['Target']
            prompt = (
                f'"{tweet}"\n'
                f'What is the stance of the previous statement toward {target}?\n'
                f'Respond with only one word: "FOR", "AGAINST", or "NEUTRAL".'
            )
            prompts.append(prompt)

        labels = ["for", "against", "neutral"]

        model_links = [
            HuggingFaceLink(
                model_name=model_name,
                model_class=AutoModelForCausalLM if any(x in model_name.lower() for x in ["llama", "mistral", "gemma"]) else T5ForConditionalGeneration,
                labels=labels,
                hf_token=token_input
            )
            for model_name in model_names
        ]

        prompt_df = pd.DataFrame({"prompts": prompts})
        llm_chain = LLMChain(chain_list=model_links)
        CoT_setting = [False] * len(model_names)

        output_dir = "./temp_output"
        os.makedirs(output_dir, exist_ok=True)

        results = llm_chain.run_chain(prompt_df, output_dir=output_dir, CoT=CoT_setting)

        data['pred_label'] = results['pred_label']
        data['conf_score'] = results['conf_score']
        data['label_logprobs'] = results['label_logprobs']
        data['raw_pred_label'] = results['raw_pred_label']

        for idx, threshold in enumerate(confidence_scores):
            data = data[data['conf_score'] >= threshold]

        output = io.StringIO()
        data.to_csv(output, index=False)
        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype='text/csv',
            download_name=f'annotated_data_{uuid.uuid4().hex}.csv',
            as_attachment=True
        )

    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

@app.route('/download/link/<int:link_num>', methods=['GET'])
def download_link_df(link_num):
    pkl_path = f"./temp_output/link_{link_num}_df.pkl"
    if not os.path.exists(pkl_path):
        return jsonify({'error': f'Link {link_num} file not found'}), 404

    df = pd.read_pickle(pkl_path)
    csv_path = f"./temp_output/link_{link_num}_df.csv"
    df.to_csv(csv_path, index=False)

    return send_file(csv_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=os.getenv('DEBUG_MODE', 'false').lower() == 'true')


