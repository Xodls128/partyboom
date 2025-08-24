import './PartySmall.css';

export default function PartySmall(props) {
  const {
    eventTitle,
    eventDate,
    placeName,
    placeImageUrl,
    attendees = 0,
    capacity = 0,
    tags = [],
    onClick: onClickDetail
  } = props;

  const d = new Date(eventDate);
  const fmt =
    `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}. ` +
    `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

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

      
        <div className="party-item__tags">
          {tags.map(tag => (
            <span key={tag.id} className="party-item__tag">#{tag.name}</span>
          ))}
        </div>
   

        <div className="party-item__meta">
          <i className="material-icons-outlined">event</i>
          <span>{fmt}</span>
        </div>

        <div className="party-item__meta">
          <i className="material-icons-outlined">check_circle_outline</i>
          <span>{attendees}/{capacity}</span>
        </div>

        <button className="party-item__button" onClick={onClickDetail}>상세보기</button>
      </div>
    </article>
  );
}