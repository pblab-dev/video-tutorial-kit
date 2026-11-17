import React from 'react';
import {Composition} from 'remotion';
import {Piloto, PILOTO_DURATION, FPS} from './Piloto.jsx';
import {Full, FULL_DURATION} from './Full.jsx';
import {GeoTeaser, GEO_DURATION} from './seo/geo.jsx';
import {SeoGeoAeo, SEOGEO_DURATION} from './seo/scenes.jsx';
import {SolarConcept, SHOTS} from './solar/concept.jsx';
import {Style3D} from './styles/style3d.jsx';
import {BadgerConcept, BSHOTS} from './badger/concept.jsx';
import {SaciConcept, SSHOTS} from './saci/concept.jsx';
import {SaciQuadro, QSHOTS} from './saci/quadro.jsx';
import {OvosConcept, OSHOTS} from './ovos/concept.jsx';
import {SolarStory, STORY_LIST} from './solar/story.jsx';
import {SolarFull, SOLAR_DURATION} from './solar/full.jsx';
import {BadgerVideo, BADGER_DURATION, BADGER_CHECK_T, BADGER_SHOTS_N} from './badger/video.jsx';
import {SaciVideo, SACI_DURATION, SACI_CHECK_T, SACI_SHOTS_N} from './saci/video.jsx';
import {OvosVideo, OVOS_DURATION, OVOS_CHECK_T, OVOS_SHOTS_N} from './ovos/video.jsx';

const checkList = (n, step) => Array.from({length: n}, (_, i) => i * step);

export const Root = () => (
  <>
    <Composition id="Piloto" component={Piloto} durationInFrames={PILOTO_DURATION} fps={FPS} width={720} height={1280} />
    <Composition id="Full" component={Full} durationInFrames={FULL_DURATION} fps={FPS} width={720} height={1280} />
    {/* checagem: frames em tempos arbitrários (props.tList) */}
    <Composition id="Check" component={Full} durationInFrames={64} fps={FPS} width={720} height={1280} defaultProps={{tList: Array.from({length: 64}, (_, i) => i * 0.5)}} />
    {/* SEO/AEO/GEO — teaser GEO em duas pegadas */}
    <Composition id="GeoNoite" component={GeoTeaser} durationInFrames={GEO_DURATION} fps={FPS} width={720} height={1280} defaultProps={{theme: 'noite'}} />
    <Composition id="GeoCidade" component={GeoTeaser} durationInFrames={GEO_DURATION} fps={FPS} width={720} height={1280} defaultProps={{theme: 'cidade'}} />
    <Composition id="GeoCheckNoite" component={GeoTeaser} durationInFrames={12} fps={FPS} width={720} height={1280} defaultProps={{theme: 'noite', tList: [0.8, 2.0, 3.2, 4.8, 6.0, 7.4, 8.6, 10.0, 10.8, 11.3, 1.5, 5.4]}} />
    <Composition id="GeoCheckCidade" component={GeoTeaser} durationInFrames={12} fps={FPS} width={720} height={1280} defaultProps={{theme: 'cidade', tList: [0.8, 2.0, 3.2, 4.8, 6.0, 7.4, 8.6, 10.0, 10.8, 11.3, 1.5, 5.4]}} />
    {/* SEO/AEO/GEO — vídeo completo, duas pegadas */}
    <Composition id="SeoNoite" component={SeoGeoAeo} durationInFrames={SEOGEO_DURATION} fps={FPS} width={720} height={1280} defaultProps={{theme: 'noite'}} />
    <Composition id="SeoCidade" component={SeoGeoAeo} durationInFrames={SEOGEO_DURATION} fps={FPS} width={720} height={1280} defaultProps={{theme: 'cidade'}} />
    <Composition id="SeoCheckNoite" component={SeoGeoAeo} durationInFrames={24} fps={FPS} width={720} height={1280} defaultProps={{theme: 'noite', tList: Array.from({length: 24}, (_, i) => i * 2)}} />
    <Composition id="SeoCheckCidade" component={SeoGeoAeo} durationInFrames={24} fps={FPS} width={720} height={1280} defaultProps={{theme: 'cidade', tList: Array.from({length: 24}, (_, i) => i * 2)}} />
    <Composition id="BadgerConcept" component={BadgerConcept} durationInFrames={BSHOTS.length} fps={FPS} width={720} height={1280} />
    <Composition id="SaciConcept" component={SaciConcept} durationInFrames={SSHOTS.length} fps={FPS} width={720} height={1280} />
    <Composition id="OvosConcept" component={OvosConcept} durationInFrames={OSHOTS.length} fps={FPS} width={720} height={1280} />
    <Composition id="SaciQuadro" component={SaciQuadro} durationInFrames={QSHOTS.length} fps={FPS} width={720} height={1280} />
    <Composition id="BadgerVideo" component={BadgerVideo} durationInFrames={BADGER_DURATION} fps={FPS} width={720} height={1280} />
    <Composition id="BadgerCheck" component={BadgerVideo} durationInFrames={BADGER_SHOTS_N} fps={FPS} width={720} height={1280} defaultProps={{tList: BADGER_CHECK_T}} />
    <Composition id="Style3D" component={Style3D} durationInFrames={150} fps={FPS} width={720} height={1280} />
    <Composition id="SolarConcept" component={SolarConcept} durationInFrames={SHOTS.length} fps={FPS} width={720} height={1280} />
    <Composition id="SolarBoard" component={SolarStory} durationInFrames={STORY_LIST.length} fps={FPS} width={720} height={1280} defaultProps={{list: STORY_LIST}} />
    <Composition id="SolarVideo" component={SolarFull} durationInFrames={SOLAR_DURATION} fps={FPS} width={720} height={1280} />
    <Composition id="SolarCheck" component={SolarFull} durationInFrames={24} fps={FPS} width={720} height={1280} defaultProps={{tList: Array.from({length: 24}, (_, i) => i * 2.7)}} />
    <Composition id="SolarClip" component={SolarStory} durationInFrames={150} fps={FPS} width={720} height={1280} defaultProps={{scene: 'apagao', u0: 0}} />
    <Composition id="SaciVideo" component={SaciVideo} durationInFrames={SACI_DURATION} fps={FPS} width={720} height={1280} />
    <Composition id="SaciCheck" component={SaciVideo} durationInFrames={SACI_SHOTS_N} fps={FPS} width={720} height={1280} defaultProps={{tList: SACI_CHECK_T}} />
    <Composition id="OvosVideo" component={OvosVideo} durationInFrames={OVOS_DURATION} fps={FPS} width={720} height={1280} />
    <Composition id="OvosCheck" component={OvosVideo} durationInFrames={OVOS_SHOTS_N} fps={FPS} width={720} height={1280} defaultProps={{tList: OVOS_CHECK_T}} />
  </>
);
