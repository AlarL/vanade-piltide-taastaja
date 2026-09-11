import React, { useState } from "react";
import { DEFAULT_DEMO_PHOTO } from "../data/demoPhotos";

interface Props { beforeImage?: string; afterImage?: string; title?: string }
export const HeroDemoSlider: React.FC<Props> = ({
  beforeImage = DEFAULT_DEMO_PHOTO.beforeImage,
  afterImage = DEFAULT_DEMO_PHOTO.afterImage,
  title = DEFAULT_DEMO_PHOTO.title,
}) => {
  const [position, setPosition] = useState(50);
  const [isOpen, setIsOpen] = useState(true);
  return (
    <section id="hero-demo-section" className="album-example" aria-label={title}>
      <div className="example-toolbar">
        <button type="button" onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} aria-controls="demo-photo-frame">
          {isOpen ? "Peida näidis" : "Vaata näidist"}
        </button>
      </div>
      {isOpen && <figure id="demo-photo-frame" className="album-photo-frame">
        <div className="album-comparison">
          <img src={afterImage} alt="Taastatud arhiivifoto" draggable={false} />
          <img src={beforeImage} alt="Algne arhiivifoto" draggable={false} style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }} />
          <div className="compare-divider" style={{ left: `${position}%` }} aria-hidden="true"><span>↔</span></div>
          <span className="compare-label before">Enne</span><span className="compare-label after">Pärast</span>
          <input type="range" min="0" max="100" value={position} onChange={e => setPosition(Number(e.target.value))} aria-label="Võrdle algset ja taastatud fotot" aria-valuetext={`Originaali nähtaval ${position}%`} className="comparison-range" />
        </div>
        <figcaption><span>{title.replace("Näide: ", "")}</span><span>Liiguta liugurit ↔</span></figcaption>
      </figure>}
    </section>
  );
};
