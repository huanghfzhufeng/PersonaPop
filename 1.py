import json
import time
import requests

# Configuration
API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.apifree.ai"

def call_apifree():
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    # 1. Submit Request
    payload = json.loads('''
{
  "model": "bytedance/seedream-4.5",
  "prompt": "A selfie of a laid-back fox (protagonist) with soft ginger fur and a white-tipped tail, capturing the whimsical calm madness vibe of a 1970s American road trip. The setting is twilight at a desert roadside diner—neon signs glow pink and blue in the background, with vintage cars parked nearby and distant cacti silhouetted against the gradient purple-orange sky. The fox is happy, grinning widely with one paw holding a half-eaten cherry pie (crust crumbs on its snout) and the other paw gripping a retro polaroid camera (as if taking the selfie). The photo has a slight motion blur (suggesting casual movement) and is slightly overexposed, with warm golden light leaking from the diner windows. Shot from a classic selfie angle (slightly high, close-up), emphasizing the fox’s playful expression. At the top of the frame, the text Seedream 4.5 is on apifree is displayed in bold, retro 70s-style font—crisp, white lettering with a subtle black outline, clearly visible against the background. 4:3 aspect ratio, soft film grain, muted yet vibrant color palette (think faded polaroid aesthetic), shallow depth of field (blurred background highlighting the fox)",
  "seed": 8899,
  "size": "2K"
}
''')

    print("Submitting request...")
    resp = requests.post(f"{BASE_URL}/v1/image/submit", headers=headers, json=payload)
    if resp.status_code != 200:
        print(f"Submission failed: {resp.text}")
        return

    data = resp.json()
    if data.get("code") != 200:
        print(f"API Error: {data.get('error')}")
        return

    request_id = data["resp_data"]["request_id"]
    print(f"Task submitted. Request ID: {request_id}")

    # 2. Poll for Result
    while True:
        time.sleep(2) # Wait 2 seconds between checks
        
        check_url = f"{BASE_URL}/v1/image/{request_id}/result"
        print(f"Checking status...")
        
        check_resp = requests.get(check_url, headers=headers)
        check_data = check_resp.json()
        
        if check_data.get("code") != 200:
            print(f"Check failed: {check_data.get('code_msg')}")
            break
            
        status = check_data["resp_data"]["status"]
        
        if status == "success":
            print("Generation completed!")
            # 3. Download Images
            for i, img_url in enumerate(check_data["resp_data"]["image_list"]):
                print(f"Downloading image {i+1}...")
                img_content = requests.get(img_url).content
                filename = f"result_{request_id}_{i+1}.png"
                with open(filename, "wb") as f:
                    f.write(img_content)
                print(f"Saved: {filename}")
            break
            
        elif status == "error" or status == "failed":
            print(f"Task failed: {check_data['resp_data'].get('error')}")
            break
            
        print(f"Status: {status}. Waiting...")

if __name__ == "__main__":
    call_apifree()
