import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 메인 지도 이미지 경로
const mapImageUrl = 'http://127.0.0.1:8000/static/map.png';
// 지도 이미지 크기 (새로운 전체 이미지 크기)
const imageWidth = 822; // 822
const imageHeight = 460; // 460

// 원본 map.png의 크기 (마커 위치 계산용)
const originalMapWidth = 822;
const originalMapHeight = 460;

// 배경 지도 이미지 경로 (더 넓은 영역을 커버)
const backgroundMapImageUrl = 'http://127.0.0.1:8000/static/full_area_map.png';
// 배경 지도 이미지 크기 (이전의 full_area_map.png 크기)
const backgroundMapWidth = 3704; // 1857
const backgroundMapHeight = 1824; // 912

// 커스텀 아이콘 정의
const partyIcon = L.icon({
  iconUrl: 'http://127.0.0.1:8000/static/partyicon.png', // 아이콘 이미지 경로
  iconSize: [64, 64], // 아이콘 크기
  iconAnchor: [32, 64], // 아이콘의 '뾰족한' 부분이 마커 위치에 오도록 조정 (아이콘 크기의 절반, 전체 높이)
  popupAnchor: [0, -64], // 팝업이 아이콘 위에 표시되도록 조정
});


const LeafletMap = ({ minSheetHeight, headerHeight, parties }) => { // parties prop 추가
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]); // 마커 인스턴스를 저장할 ref

  useEffect(() => {
    // 지도가 여러 번 초기화되는 것을 방지
    if (mapInstance.current) return;

    // 지도를 담을 컨테이너가 필요
    if (mapRef.current) {
      // 이미지 경계를 정의. 좌표는 [y, x] 형식.
      const bounds = [[0, 0], [imageHeight, imageWidth]];

      // 컨테이너 크기를 미리 가져와서 줌 레벨 계산에 사용
      const containerHeight = mapRef.current.clientHeight;
      const containerWidth = mapRef.current.clientWidth; // 이 값은 사용되지 않지만, 일관성을 위해 유지

      // 높이 기준으로 화면을 채우도록 스케일 계산 (새로운 전체 이미지 기준)
      const scale = containerHeight / imageHeight;
      const zoomOffset = 0;
      const initialZoom = Math.log2(scale) + zoomOffset;

      mapInstance.current = L.map(mapRef.current, {
        crs: L.CRS.Simple,
        minZoom: initialZoom, // 최소 줌 레벨을 계산된 초기 줌 레벨로 설정
        zoomControl: false, // 확대/축소 버튼 비활성화
        maxBounds: bounds, // 맵 이동을 이미지 경계로 제한
        maxBoundsViscosity: 1.0, // 경계 밖으로 드래그 방지
        attributionControl: false, // Leaflet 저작권 표시 제거
        bounceAtZoomLimits: false, // 줌 한계에서 바운스 효과 제거
      });

      const map = mapInstance.current;

      // 배경 지도 오버레이 (더 넓은 영역을 커버)
      // 배경 지도의 bounds는 메인 지도의 좌표계에 맞춰서 설정해야 함
      // 예를 들어, 메인 지도가 배경 지도의 중앙에 위치한다고 가정
      const bgOffsetTop = (backgroundMapHeight - imageHeight) / 0.2 - 6250; // 배경 이미지의 상단 오프셋
      const bgOffsetLeft = (backgroundMapWidth - imageWidth) / 0.2 - 12870; // 배경 이미지의 왼쪽 오프셋

      const backgroundBoundsAdjusted = [
        [-bgOffsetTop, -bgOffsetLeft],
        [backgroundMapHeight - bgOffsetTop, backgroundMapWidth - bgOffsetLeft]
      ];


      L.imageOverlay(backgroundMapImageUrl, backgroundBoundsAdjusted, { zIndex: 1 }).addTo(map);

      // 메인 지도 오버레이
      L.imageOverlay(mapImageUrl, bounds, { zIndex: 2 }).addTo(map);

      // 계산된 줌 레벨과 이미지 중앙으로 뷰를 설정
      map.setView([imageHeight / 2, imageWidth / 2], initialZoom);
    }
    
    // 컴포넌트가 언마운트될 때 맵 인스턴스를 파괴하는 정리 함수
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // parties 데이터가 변경될 때마다 마커를 업데이트하는 useEffect
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // 기존 마커 제거
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // 원본 map.png가 full_area_map.png 내에서 시작하는 오프셋 계산
    const offsetX = (imageWidth - originalMapWidth) / 2;
    const offsetY = (imageHeight - originalMapHeight) / 2;

    // 새 마커 추가
    parties.forEach(party => {
      // 정규화된 좌표를 원본 map.png 픽셀 좌표로 변환 후, 전체 이미지 내 오프셋 적용
      // place_y_norm, place_x_norm이 0~1 사이의 값이라고 가정
      const pixelY = (party.place_y_norm * originalMapHeight) + offsetY;
      const pixelX = (party.place_x_norm * originalMapWidth) + offsetX;

      // Leaflet은 [위도, 경도] 또는 [y, x] 순서를 사용
      const markerPosition = [pixelY, pixelX];

      const marker = L.marker(markerPosition, { icon: partyIcon }).addTo(map); // 커스텀 아이콘 적용
      marker.bindPopup(`<b>${party.eventTitle}</b><br>${party.placeName}`); // 팝업 추가
      markersRef.current.push(marker);
    });

  }, [parties, mapInstance.current]); // parties 또는 mapInstance가 변경될 때마다 실행

  return <div ref={mapRef} style={{ position: 'absolute', top: `${headerHeight}px`, left: 0, right: 0, bottom: `${minSheetHeight}%` }} />;
};

export default LeafletMap;
