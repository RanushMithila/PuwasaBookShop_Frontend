import json
import sys

def main():
    payload = {}
    if len(sys.argv) > 1:
        try:
            payload = json.loads(sys.argv[1])
        except Exception:
            payload = {"raw": sys.argv[1]}
    print("Hello from Python! Payload:")
    print(json.dumps(payload))

if __name__ == "__main__":
    main()
