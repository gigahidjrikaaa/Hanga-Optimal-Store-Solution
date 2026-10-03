#!/usr/bin/env python3
"""
Hanga - Optimal Store Solution Setup Script
Automates virtual environment creation, Python & Node.js dependency installation,
and environment variable initialization.
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
VENV_DIR = ROOT_DIR / ".venv"
API_DIR = ROOT_DIR / "apps" / "api"
WEB_DIR = ROOT_DIR / "apps" / "web"

def print_header(title: str):
    print("\n" + "=" * 50)
    print(f"  {title}")
    print("=" * 50)

def get_venv_python() -> str:
    if sys.platform == "win32":
        return str(VENV_DIR / "Scripts" / "python.exe")
    return str(VENV_DIR / "bin" / "python")

def get_venv_pip() -> str:
    if sys.platform == "win32":
        return str(VENV_DIR / "Scripts" / "pip.exe")
    return str(VENV_DIR / "bin" / "pip")

def check_prerequisites():
    print_header("Checking Prerequisites")
    
    # Check Python version
    major, minor = sys.version_info[:2]
    print(f"Detected Python version: {major}.{minor}")
    if (major, minor) < (3, 10):
        print("[ERROR] Python 3.10 or higher is required.")
        sys.exit(1)
    elif (major, minor) < (3, 11):
        print("[WARN] Python 3.11+ is recommended, but 3.10 will be attempted.")
    else:
        print("[OK] Python version check passed.")

    # Check Node.js & npm
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True).strip()
        npm_version = subprocess.check_output(["npm", "--version"], text=True).strip()
        print(f"Detected Node.js: {node_version}, npm: {npm_version}")
        print("[OK] Node.js check passed.")
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("[WARN] Node.js or npm not found in PATH. Make sure Node.js (v20+) is installed.")

def setup_virtualenv():
    print_header("Setting Up Python Virtual Environment")
    
    if not VENV_DIR.exists():
        print(f"Creating Python virtual environment at {VENV_DIR}...")
        subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
        print("[OK] Virtual environment created.")
    else:
        print(f"[OK] Virtual environment already exists at {VENV_DIR}")

def install_python_dependencies():
    print_header("Installing Python Backend Dependencies")
    
    python_cmd = get_venv_python()
    pip_cmd = get_venv_pip()
    print("Upgrading pip in virtual environment...")
    subprocess.run([python_cmd, "-m", "pip", "install", "--upgrade", "pip"], check=False)

    requirements_file = API_DIR / "requirements.txt"
    if requirements_file.exists():
        print(f"Installing dependencies from {requirements_file}...")
        subprocess.run([pip_cmd, "install", "-r", str(requirements_file)], check=True)
    
    # Install editable package if pyproject.toml exists
    if (API_DIR / "pyproject.toml").exists():
        print("Installing API package in editable mode...")
        subprocess.run([pip_cmd, "install", "-e", f"{API_DIR}[dev]"], check=True)
        
    print("[OK] Python dependencies installed successfully.")

def install_node_dependencies():
    print_header("Installing Node.js Frontend Dependencies")
    
    if not (WEB_DIR / "package.json").exists():
        print("[WARN] Web package.json not found, skipping npm install.")
        return

    print("Running npm install in apps/web...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    subprocess.run([npm_cmd, "install"], cwd=WEB_DIR, check=True)
    print("[OK] Frontend dependencies installed successfully.")

def setup_environment_files():
    print_header("Setting Up Environment Files")

    # API .env
    api_env_example = API_DIR / ".env.example"
    api_env = API_DIR / ".env"
    if api_env_example.exists() and not api_env.exists():
        shutil.copy(api_env_example, api_env)
        print(f"[OK] Created {api_env} from .env.example")
    elif api_env.exists():
        print(f"[INFO] {api_env} already exists.")

    # Web .env.local
    web_env_example = WEB_DIR / ".env.example"
    web_env = WEB_DIR / ".env.local"
    if web_env_example.exists() and not web_env.exists():
        shutil.copy(web_env_example, web_env)
        print(f"[OK] Created {web_env} from .env.example")
    elif web_env.exists():
        print(f"[INFO] {web_env} already exists.")

def print_completion_message():
    print_header("Setup Complete!")
    
    if sys.platform == "win32":
        activate_cmd = r".venv\Scripts\activate"
    else:
        activate_cmd = "source .venv/bin/activate"

    print("All dependencies and configuration files have been prepared.")
    print("\nTo start developing:")
    print(f" 1. Activate Python virtual environment:  {activate_cmd}")
    print(" 2. Run Backend API:                       cd apps/api && uvicorn app.main:app --reload --port 8080")
    print(" 3. Run Frontend Web App:                  cd apps/web && npm run dev")
    print("\nOr run using Docker Compose:")
    print(" docker compose up --build")
    print("\n" + "=" * 50 + "\n")

def main():
    try:
        check_prerequisites()
        setup_virtualenv()
        install_python_dependencies()
        install_node_dependencies()
        setup_environment_files()
        print_completion_message()
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Setup failed during step execution: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
