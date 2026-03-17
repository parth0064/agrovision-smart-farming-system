import subprocess
import sys

def run_git_push():
    cmd = ["git", "push", "-u", "origin", "main"]
    try:
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    run_git_push()
