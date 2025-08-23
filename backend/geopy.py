import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("KAKAO_GEOPY_API_KEY")

def geocode_with_kakao(address):
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {API_KEY}"}
    params = {"query": address}
    response = requests.get(url, headers=headers, params=params)
    result = response.json()
    print("DEBUG RESPONSE:", result)   # <- 추가
    if result.get("documents"):
        doc = result["documents"][0]["address"]
        return {"latitude": doc["y"], "longitude": doc["x"]}
    return {"latitude": None, "longitude": None}

# 예시 사용법
print(geocode_with_kakao("서울 성북구 정릉로 165"))
