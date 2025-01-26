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
from transformers import BitsAndBytesConfig
import uuid

app = Flask(__name__)

UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'user_uploads')
OFFLOAD_FOLDER = './offload'
os.makedirs(OFFLOAD_FOLDER, exist_ok=True) 
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
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

    if not token_input:
        print("HuggingFace token is missing.")
        return jsonify({"error": "HuggingFace token is required"}), 400

    # Save CSV file with a unique filename
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4().hex}.csv")
    try:
        csv_file.save(file_path)
        print(f"File saved to: {file_path}")
        print("User uploads folder content:", os.listdir(app.config['UPLOAD_FOLDER']))
    except Exception as e:
        print(f"Error saving file: {e}")
        return jsonify({'error': f'Error saving file: {str(e)}'}), 500

    # Initialize HuggingFaceLink
    try:
        # quant_config = BitsAndBytesConfig(
        #     load_in_8bit=True,  # Enable 8-bit quantization
        #     llm_int8_enable_fp32_cpu_offload=True  # Enable offloading to CPU if needed
        # )

        hf_link = HuggingFaceLink(
            model_name="google/flan-t5-small",
            #"meta-llama/Llama-3.3-70B-Instruct",
            model_class=T5ForConditionalGeneration,
            #AutoModelForCausalLM,
            labels=["FOR", "AGAINST", "NEUTRAL"],
            hf_token=token_input,
            # quantization_config=quant_config,
        )
        hf_link.load_model()

    except Exception as e:
        print(f"Error initializing HuggingFaceLink: {e}")
        return jsonify({'error': f'Error initializing HuggingFaceLink: {str(e)}'}), 500

    try:
        # Load CSV and validate columns
        data = pd.read_csv(file_path)
        if data.empty:
            print("Uploaded CSV is empty.")
            return jsonify({'error': 'Uploaded CSV is empty.'}), 400

        required_columns = {'Tweet', 'Target'}
        if not required_columns.issubset(data.columns):
            print("Missing required columns.")
            return jsonify({'error': f'CSV must contain columns: {", ".join(required_columns)}'}), 400

        # I think target is "opinion towards", other columns are truth labels
        prompts = []
        for _, row in data.iterrows():
            tweet = row['Tweet']
            target = row['Target']
            #Change prompt structure if necessary
            prompt = (
                f'"{tweet}"\n'
                f'What is the stance of the previous statement toward {target}?\n'
                f'Respond with only one word: "FOR", "AGAINST", or "NEUTRAL".'
            )
            prompts.append(prompt)

        results = hf_link.get_labels(prompts=prompts)

        # Add results to the final annotated data
        data['pred_label'] = results['pred_label']
        data['conf_score'] = results['conf_score']
        data['label_logprobs'] = results['label_logprobs']
        data['raw_pred_label'] = results['raw_pred_label']

        os.makedirs('uploads', exist_ok=True)
        print("Uploads folder created or already exists.")

        # Save the annotated file with a unique filename
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

