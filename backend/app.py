from chain_ensembles import LLMChain
from flask import Flask, request, jsonify
import os
import pandas as pd
from chain_ensembles.hf_link import HuggingFaceLink
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    T5ForConditionalGeneration,
    BitsAndBytesConfig,
)
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'user_uploads')
OFFLOAD_FOLDER = './offload'
OUTPUT_DIR = './chain_out' 
os.makedirs(OFFLOAD_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024 

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
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4().hex}.csv")
    try:
        csv_file.save(file_path)
        print(f"File saved to: {file_path}")
    except Exception as e:
        print(f"Error saving file: {e}")
        return jsonify({'error': f'Error saving file: {str(e)}'}), 500

    try:
        data = pd.read_csv(file_path)
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
        
        model_links = []
        for model_name in model_names:
            model_links.append(
                HuggingFaceLink(
                    model_name=model_name, 
                    model_class=AutoModelForCausalLM if "llama" in model_name.lower() else T5ForConditionalGeneration, 
                    labels=labels,
                    hf_token=token_input,
                    #quantization_config=BitsAndBytesConfig(load_in_8bit=True)
                )
            )

        prompt_df = pd.DataFrame({"prompts": prompts})
        
        llm_chain = LLMChain(chain_list=model_links)
        CoT_setting = [False] * len(model_names)
        
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        results = llm_chain.run_chain(prompt_df, OUTPUT_DIR, CoT_setting)

        data['pred_label'] = results['pred_label']
        data['conf_score'] = results['conf_score']
        data['label_logprobs'] = results['label_logprobs']
        data['raw_pred_label'] = results['raw_pred_label']
        
        for idx, threshold in enumerate(confidence_scores):
            data = data[data['conf_score'] >= threshold]
        
        os.makedirs('uploads', exist_ok=True)
        output_file = os.path.join('uploads', f'annotated_data_{uuid.uuid4().hex}.csv')
        try:
            data.to_csv(output_file, index=False)
            print(f"Annotated file saved to: {output_file}")
        except Exception as e:
            print(f"Error saving annotated file: {e}")
            return jsonify({'error': f'Error saving annotated file: {str(e)}'}), 500

        return jsonify({'message': 'File processed', 'output_file': output_file})
    except Exception as e:
        print(f"Error processing file: {e}")
        return jsonify({'error': f'Error processing file: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=os.getenv('DEBUG_MODE', 'false').lower() == 'true')
