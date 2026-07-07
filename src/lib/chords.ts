import type { FretShape } from '../types'

// Shapes written low E → high e. Frets are absolute; 0 = open, 'x' = muted.
function shape(frets: string, fingers: string, baseFret = 1): FretShape {
  const parseCell = (c: string) => (c === 'x' ? ('x' as const) : c === '.' ? null : parseInt(c, 16))
  return {
    frets: [...frets].map(parseCell),
    fingers: [...fingers].map((c) => (c === '0' || c === 'x' || c === '.' ? null : parseInt(c, 10))),
    baseFret,
  }
}

export interface LibraryChord {
  name: string
  shape: FretShape
}

export const CHORD_LIBRARY: LibraryChord[] = [
  { name: 'A', shape: shape('x02220', '001230') },
  { name: 'Am', shape: shape('x02210', '002310') },
  { name: 'A7', shape: shape('x02020', '002030') },
  { name: 'Amaj7', shape: shape('x02120', '002130') },
  { name: 'Asus2', shape: shape('x02200', '002300') },
  { name: 'Asus4', shape: shape('x02230', '001240') },
  { name: 'B', shape: shape('x24442', '013331', 2) },
  { name: 'Bm', shape: shape('x24432', '013421', 2) },
  { name: 'B7', shape: shape('x21202', '021304') },
  { name: 'C', shape: shape('x32010', '032010') },
  { name: 'Cmaj7', shape: shape('x32000', '032000') },
  { name: 'C7', shape: shape('x32310', '032410') },
  { name: 'Cadd9', shape: shape('x32033', '021034') },
  { name: 'D', shape: shape('xx0232', '000132') },
  { name: 'Dm', shape: shape('xx0231', '000231') },
  { name: 'D7', shape: shape('xx0212', '000213') },
  { name: 'Dsus2', shape: shape('xx0230', '000130') },
  { name: 'Dsus4', shape: shape('xx0233', '000134') },
  { name: 'E', shape: shape('022100', '023100') },
  { name: 'Em', shape: shape('022000', '023000') },
  { name: 'E7', shape: shape('020100', '020100') },
  { name: 'Esus4', shape: shape('022200', '023400') },
  { name: 'F', shape: shape('133211', '134211') },
  { name: 'Fmaj7', shape: shape('xx3210', '003210') },
  { name: 'Fm', shape: shape('133111', '134111') },
  { name: 'F#m', shape: shape('244222', '134111', 2) },
  { name: 'G', shape: shape('320003', '210004') },
  { name: 'G7', shape: shape('320001', '320001') },
  { name: 'Gmaj7', shape: shape('320002', '210003') },
]

export function findLibraryChord(name: string): LibraryChord | undefined {
  return CHORD_LIBRARY.find((c) => c.name.toLowerCase() === name.toLowerCase())
}
