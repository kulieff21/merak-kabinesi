import { acoustic } from './acoustic.js';
import { television } from './television.js';
import { pneumatic } from './pneumatic.js';
import { antikythera } from './antikythera.js';
import { jacquard } from './jacquard.js';
import { theremin } from './theremin.js';
import { harmonograph } from './harmonograph.js';
import { zoetrope } from './zoetrope.js';
import { lantern } from './lantern.js';

export const demoIds = ['ses-aynalari', 'mekanik-televizyon', 'pnomatik-posta', 'antikythera', 'jacquard', 'theremin', 'harmonograf', 'zoetrop', 'sihirli-fener'];
const demos = { 'ses-aynalari': acoustic, 'mekanik-televizyon': television, 'pnomatik-posta': pneumatic, antikythera, jacquard, theremin, harmonograf: harmonograph, zoetrop: zoetrope, 'sihirli-fener': lantern };
export function mountDemo(id, root) { if (!demos[id]) throw new Error(`Unknown exhibit: ${id}`); return demos[id](root); }
