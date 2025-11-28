"""
Setup script for Piper TTS Service
Downloads voice models automatically
"""

import os
import urllib.request
from pathlib import Path

# Voice models to download
VOICE_MODELS = {
    "Telugu (Keerthi)": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/te/te_IN/keerthi/medium/te_IN-keerthi-medium.onnx",
        "filename": "te_IN-keerthi-medium.onnx",
        "size": "~60 MB"
    },
    "Hindi": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/hi/hi_IN/medium/hi_IN-medium.onnx",
        "filename": "hi_IN-medium.onnx",
        "size": "~50 MB"
    },
    "Tamil": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/ta/ta_IN/medium/ta_IN-medium.onnx",
        "filename": "ta_IN-medium.onnx",
        "size": "~55 MB"
    },
    "English (Lessac)": {
        "url": "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx",
        "filename": "en_US-lessac-medium.onnx",
        "size": "~50 MB"
    }
}

def download_file(url, destination):
    """Download file with progress"""
    print(f"Downloading {destination.name}...")
    
    def progress_hook(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        print(f"\rProgress: {percent}%", end="")
    
    urllib.request.urlretrieve(url, destination, progress_hook)
    print("\n✅ Downloaded!")

def main():
    print("=" * 70)
    print("Piper TTS Service - Voice Model Setup")
    print("=" * 70)
    
    # Create models directory
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    print(f"\n📁 Models directory: {models_dir.absolute()}")
    
    # Check existing models
    existing_models = list(models_dir.glob("*.onnx"))
    if existing_models:
        print(f"\n✅ Found {len(existing_models)} existing models:")
        for model in existing_models:
            print(f"   - {model.name}")
    
    # Ask which models to download
    print("\n📥 Available voice models:")
    for i, (name, info) in enumerate(VOICE_MODELS.items(), 1):
        status = "✅ Downloaded" if (models_dir / info["filename"]).exists() else "⬇️  Not downloaded"
        print(f"   {i}. {name} ({info['size']}) - {status}")
    
    print("\nOptions:")
    print("  1. Download all models")
    print("  2. Download specific models")
    print("  3. Skip download")
    
    choice = input("\nYour choice (1-3): ").strip()
    
    if choice == "1":
        # Download all
        for name, info in VOICE_MODELS.items():
            destination = models_dir / info["filename"]
            if destination.exists():
                print(f"\n⏭️  Skipping {name} (already exists)")
            else:
                print(f"\n📥 Downloading {name}...")
                try:
                    download_file(info["url"], destination)
                except Exception as e:
                    print(f"❌ Failed: {e}")
    
    elif choice == "2":
        # Download specific
        print("\nEnter model numbers to download (comma-separated, e.g., 1,3):")
        selected = input("Models: ").strip()
        
        try:
            indices = [int(x.strip()) for x in selected.split(",")]
            for idx in indices:
                if 1 <= idx <= len(VOICE_MODELS):
                    name, info = list(VOICE_MODELS.items())[idx - 1]
                    destination = models_dir / info["filename"]
                    
                    if destination.exists():
                        print(f"\n⏭️  Skipping {name} (already exists)")
                    else:
                        print(f"\n📥 Downloading {name}...")
                        try:
                            download_file(info["url"], destination)
                        except Exception as e:
                            print(f"❌ Failed: {e}")
        except Exception as e:
            print(f"❌ Invalid input: {e}")
    
    else:
        print("\n⏭️  Skipping download")
    
    # Final summary
    print("\n" + "=" * 70)
    print("Setup Complete!")
    print("=" * 70)
    
    final_models = list(models_dir.glob("*.onnx"))
    print(f"\n✅ Total models available: {len(final_models)}")
    for model in final_models:
        print(f"   - {model.name}")
    
    if final_models:
        print("\n🚀 Next steps:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Run the service: python app.py")
        print("   3. Test: curl http://localhost:8000/health")
    else:
        print("\n⚠️  No models downloaded. Download at least one model to use TTS.")
        print("   Run this script again or download manually from:")
        print("   https://huggingface.co/rhasspy/piper-voices")
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    main()
