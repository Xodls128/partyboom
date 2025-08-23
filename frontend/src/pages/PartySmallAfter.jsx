import './PartySmallAfter.css';

export default function PartySmallAfter(props) {
  const {
    eventTitle = props.title,
    eventDate = props.date,
    placeName = props.location,
    placeImageUrl = props.thumbnailUrl,
    onClickDetail = props.onClick,
  } = props;

  const d = new Date(eventDate);
  const fmt =
    `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}. ` +
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  return (
    <article className="party-item">
      <div className="party-item__image-wrap">
        <img src={placeImageUrl} alt={eventTitle} className="party-item__image" />
        {placeName && (
          <span className="party-item__place-badge">
            <span className="party-item__place-icon-svg" aria-label="장소 아이콘"></span>
            {placeName}
          </span>
        )}
      </div>

      <div className="party-item__content">
        <h3 className="party-item__title">{eventTitle}</h3>

        <div className="party-item__meta">
          <i className="material-icons-outlined">event</i>
          <span>{fmt}</span>
        </div>

        <div className="party-item__meta">
          <i className="material-icons-outlined">report</i>
          <span className='report'>프로필 확인 및 신고</span>
        </div>

        <button className="party-item__button" onClick={onClickDetail}>리뷰 남기기</button>
      </div>
    </article>
  );
}