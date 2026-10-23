// Декорации карты для каждого города. Координаты в системе 390 × 600, как у Кашгара:
// дорога идёт посередине (x ≈ 80–260), рисунки стоят по краям.
import { kashgarDecor } from './sceneArt';

export type CityScene = { ground: string; decor: string };

const GREEN_SHADE = '#B9D9A4';
const SAND_SHADE = '#E2C79F';

const grid = (x0: number, y0: number, cols: number, rows: number, dx: number, dy: number, cell: (x: number, y: number) => string) =>
  Array.from({ length: rows * cols }, (_, i) => cell(x0 + (i % cols) * dx, y0 + Math.floor(i / cols) * dy)).join('');

const vineyard = (x: number, y: number) =>
  `<g transform="translate(${x},${y})"><ellipse cx="56" cy="80" rx="52" ry="5" fill="${SAND_SHADE}"/><rect x="12" y="20" width="6" height="60" fill="#8A5A3B"/><rect x="94" y="20" width="6" height="60" fill="#8A5A3B"/><rect x="6" y="16" width="100" height="6" rx="3" fill="#A06B45"/><g fill="#57B36F"><ellipse cx="20" cy="16" rx="14" ry="9"/><ellipse cx="44" cy="12" rx="16" ry="10"/><ellipse cx="70" cy="14" rx="16" ry="10"/><ellipse cx="94" cy="16" rx="14" ry="9"/></g><g fill="#9BC75A"><circle cx="36" cy="30" r="4"/><circle cx="42" cy="30" r="4"/><circle cx="39" cy="36" r="4"/><circle cx="42" cy="42" r="3.5"/><circle cx="70" cy="30" r="4"/><circle cx="76" cy="30" r="4"/><circle cx="73" cy="36" r="4"/><circle cx="73" cy="42" r="3.5"/></g></g>`;

const spruce = (x: number, y: number, h: number) =>
  `<g transform="translate(${x},${y})"><rect x="-3" y="${h - 10}" width="6" height="12" fill="#8A5A3B"/><path d="M0 0 L${h * 0.3} ${h * 0.45} L${h * 0.14} ${h * 0.45} L${h * 0.38} ${h * 0.8} L${-h * 0.38} ${h * 0.8} L${-h * 0.14} ${h * 0.45} L${-h * 0.3} ${h * 0.45}Z" fill="#2F7D52"/></g>`;

const fruitTree = (x: number, y: number, fruit: string, shade = GREEN_SHADE) =>
  `<g transform="translate(${x},${y})"><ellipse cx="46" cy="106" rx="34" ry="5" fill="${shade}"/><path d="M42 106 L44 66 Q34 58 28 50 M45 72 Q56 62 62 54" fill="none" stroke="#8A5A3B" stroke-width="6" stroke-linecap="round"/><circle cx="30" cy="42" r="22" fill="#4FA36A"/><circle cx="60" cy="40" r="24" fill="#57B36F"/><circle cx="46" cy="22" r="20" fill="#4FA36A"/><g fill="${fruit}"><circle cx="24" cy="44" r="6"/><circle cx="62" cy="30" r="6.5"/><circle cx="48" cy="52" r="5.5"/><circle cx="72" cy="52" r="5"/><circle cx="40" cy="16" r="5"/><circle cx="56" cy="14" r="4.5"/></g></g>`;

const snowPeaks = (x: number, y: number, shade: string) =>
  `<g transform="translate(${x},${y})"><ellipse cx="70" cy="104" rx="72" ry="6" fill="${shade}"/><path d="M0 104 L38 30 L60 62 L86 12 L120 70 L136 52 L150 104Z" fill="#7E95A8"/><path d="M38 30 L48 49 L42 46 L34 54 L30 45Z M86 12 L100 38 L92 34 L84 42 L78 34 L74 36Z M136 52 L142 66 L134 62Z" fill="#FFFFFF"/><path d="M60 62 L74 104 L48 104Z" fill="#6A8093" opacity=".6"/></g>`;

const turpan = [
  '<ellipse cx="60" cy="230" rx="70" ry="26" fill="#ECD3AE"/><ellipse cx="330" cy="440" rx="80" ry="30" fill="#ECD3AE"/><ellipse cx="300" cy="245" rx="56" ry="18" fill="#E5C79A"/>',
  '<g fill="#C9A274"><circle cx="150" cy="380" r="3"/><circle cx="252" cy="140" r="3"/><circle cx="40" cy="390" r="2.5"/><circle cx="346" cy="330" r="2.5"/><circle cx="250" cy="520" r="3"/></g>',
  // Пылающие горы
  '<g transform="translate(0,26)"><ellipse cx="70" cy="100" rx="72" ry="6" fill="#E2B98F"/><path d="M0 100 L20 48 L44 70 L70 26 L100 64 L124 44 L144 100Z" fill="#D9653B"/><path d="M10 100 L28 62 L48 80 L72 44 L98 78 L120 60 L134 100Z" fill="#E8834F"/><path d="M18 88 Q40 80 60 90 M72 68 Q90 62 112 72 M40 96 Q70 88 104 96 M60 78 Q72 72 86 80" stroke="#B94A2A" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>',
  // минарет Эмин
  `<g transform="translate(272,4)"><ellipse cx="56" cy="134" rx="54" ry="7" fill="${SAND_SHADE}"/><rect x="4" y="98" width="104" height="34" fill="#D8B07A"/><rect x="2" y="94" width="108" height="6" fill="#C59A62"/><path d="M14 132 L14 114 Q22 104 30 114 L30 132Z M82 132 L82 114 Q90 104 98 114 L98 132Z" fill="#8A5A3B"/><path d="M38 132 L44 18 L68 18 L74 132Z" fill="#C99A62"/><path d="M40 112 L72 112 M41 92 L71 92 M42 72 L70 72 M43 52 L69 52 M44 34 L68 34" stroke="#E7C38E" stroke-width="3"/><path d="M42 104 L56 84 L70 104 M43 64 L56 44 L69 64" stroke="#A97B47" stroke-width="2" fill="none"/><path d="M42 18 Q56 0 70 18Z" fill="#B88A55"/><path d="M50 30 L50 24 Q56 18 62 24 L62 30Z" fill="#5A3420"/></g>`,
  // сушильня для изюма
  `<g transform="translate(4,252)"><ellipse cx="50" cy="104" rx="50" ry="6" fill="${SAND_SHADE}"/><rect x="4" y="28" width="92" height="74" fill="#D2A26C"/><rect x="0" y="22" width="100" height="8" fill="#B9865A"/>` +
    grid(12, 38, 6, 4, 13.5, 16, (x, y) => `<rect x="${x}" y="${y}" width="7" height="9" fill="#7A4E30"/>`) + '</g>',
  vineyard(6, 410),
  // дыни
  `<g transform="translate(286,392)"><ellipse cx="48" cy="96" rx="48" ry="6" fill="${SAND_SHADE}"/><ellipse cx="30" cy="74" rx="28" ry="20" fill="#E6C65A"/><ellipse cx="70" cy="78" rx="26" ry="17" fill="#C9C45A"/><ellipse cx="50" cy="52" rx="24" ry="16" fill="#EBD27A"/><g fill="none" stroke="#B8962E" stroke-width="1.5" opacity=".7"><path d="M8 70 Q30 60 52 72 M10 82 Q30 74 54 84 M30 46 Q50 40 72 50 M30 58 Q50 52 72 60 M48 76 Q70 68 92 80"/></g><path d="M50 36 Q54 28 60 30" stroke="#5E8C3A" stroke-width="3" fill="none" stroke-linecap="round"/></g>`,
  // бархан
  '<g transform="translate(262,520)"><path d="M0 70 Q40 20 80 40 Q110 54 128 70Z" fill="#E9CC98"/><path d="M40 34 Q60 30 80 40 Q70 56 60 70" fill="none" stroke="#D9B477" stroke-width="2"/></g>',
].join('');

const hotan = [
  '<ellipse cx="60" cy="230" rx="70" ry="26" fill="#EADCB6"/><ellipse cx="320" cy="270" rx="70" ry="22" fill="#EADCB6"/><ellipse cx="80" cy="560" rx="70" ry="20" fill="#E5D3A6"/>',
  '<g fill="#CDB585"><circle cx="150" cy="380" r="3"/><circle cx="252" cy="140" r="3"/><circle cx="40" cy="390" r="2.5"/><circle cx="346" cy="340" r="2.5"/></g>',
  // тутовое дерево
  fruitTree(6, 10, '#5B2A6E', SAND_SHADE),
  // барханы и верблюд
  '<g transform="translate(262,20)"><path d="M0 120 Q40 70 80 86 Q110 98 128 120Z" fill="#E9CC98"/><path d="M30 120 Q70 92 128 104 L128 120Z" fill="#E2BE82"/>' +
    '<g transform="translate(30,28)"><path d="M14 46 L12 84 M22 48 L22 84 M50 48 L52 84 M58 46 L60 84" stroke="#A9773F" stroke-width="5" stroke-linecap="round"/><path d="M8 50 Q6 30 22 26 Q28 8 38 24 Q46 10 54 26 Q66 30 64 50Z" fill="#C8904F"/><path d="M60 34 Q74 26 76 10 L84 8 Q90 10 88 16 L80 18 Q80 36 64 46Z" fill="#C8904F"/><circle cx="83" cy="12" r="1.5" fill="#3A2412"/><path d="M8 40 Q0 44 2 56" stroke="#A9773F" stroke-width="3" fill="none"/><rect x="26" y="20" width="20" height="10" rx="3" fill="#C8384A"/></g></g>',
  // ковёр на раме
  `<g transform="translate(4,250)"><ellipse cx="50" cy="110" rx="48" ry="6" fill="${SAND_SHADE}"/><rect x="6" y="6" width="6" height="104" fill="#8A5A3B"/><rect x="88" y="6" width="6" height="104" fill="#8A5A3B"/><rect x="2" y="4" width="96" height="6" rx="3" fill="#A06B45"/><rect x="14" y="12" width="72" height="86" fill="#B3263A"/><rect x="20" y="18" width="60" height="74" fill="none" stroke="#F2B33D" stroke-width="3"/><path d="M50 30 L66 55 L50 80 L34 55Z" fill="#1F2A44"/><path d="M50 40 L59 55 L50 70 L41 55Z" fill="#F2B33D"/><g fill="#FFF3D6"><circle cx="28" cy="26" r="2.5"/><circle cx="72" cy="26" r="2.5"/><circle cx="28" cy="84" r="2.5"/><circle cx="72" cy="84" r="2.5"/></g><path d="M16 98 L16 104 M24 98 L24 104 M32 98 L32 104 M40 98 L40 104 M48 98 L48 104 M56 98 L56 104 M64 98 L64 104 M72 98 L72 104 M80 98 L80 104" stroke="#F2B33D" stroke-width="2"/></g>`,
  // река с нефритом
  '<g transform="translate(0,410)"><path d="M0 30 Q30 14 60 30 Q90 46 116 30 L116 74 Q90 90 60 74 Q30 58 0 74Z" fill="#8CC7E8"/><path d="M8 44 Q30 34 50 46 M60 56 Q80 66 104 54" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".8"/><g><ellipse cx="24" cy="62" rx="9" ry="6" fill="#7DC4A0"/><ellipse cx="54" cy="40" rx="7" ry="5" fill="#F4F1E4"/><ellipse cx="80" cy="66" rx="10" ry="6" fill="#4FA383"/><ellipse cx="98" cy="42" rx="6" ry="4" fill="#B9E2C8"/></g></g>',
  // атлас на станке
  `<g transform="translate(278,380)"><ellipse cx="54" cy="116" rx="52" ry="6" fill="${SAND_SHADE}"/><rect x="6" y="4" width="6" height="110" fill="#8A5A3B"/><rect x="96" y="4" width="6" height="110" fill="#8A5A3B"/><rect x="2" y="2" width="104" height="7" rx="3" fill="#A06B45"/><rect x="16" y="10" width="76" height="92" fill="#FFFFFF"/>` +
    [['#C8384A', 10], ['#F2B33D', 28], ['#1872B8', 46], ['#57B36F', 64], ['#C8384A', 82]].map(([c, y]) =>
      `<path d="M16 ${y} L28 ${Number(y) + 9} L40 ${y} L52 ${Number(y) + 9} L64 ${y} L76 ${Number(y) + 9} L92 ${y} L92 ${Number(y) + 18} L76 ${Number(y) + 27} L64 ${Number(y) + 18} L52 ${Number(y) + 27} L40 ${Number(y) + 18} L28 ${Number(y) + 27} L16 ${Number(y) + 18}Z" fill="${c}"/>`).join('') +
    '</g>',
  '<g transform="translate(262,520)"><path d="M0 70 Q40 20 80 40 Q110 54 128 70Z" fill="#E9CC98"/></g>',
].join('');

const ghulja = [
  '<ellipse cx="60" cy="230" rx="70" ry="30" fill="#E3F2D7"/><ellipse cx="330" cy="430" rx="80" ry="34" fill="#E3F2D7"/><ellipse cx="300" cy="240" rx="60" ry="22" fill="#C9E4B8"/>',
  '<g fill="#F2B33D"><circle cx="150" cy="380" r="4"/><circle cx="252" cy="140" r="4"/><circle cx="346" cy="340" r="3"/></g><g fill="#FFFFFF"><circle cx="40" cy="390" r="3.5"/><circle cx="250" cy="520" r="3.5"/><circle cx="130" cy="30" r="3"/></g>',
  snowPeaks(0, 6, GREEN_SHADE),
  // яблоня
  fruitTree(290, 10, '#D8343F'),
  // ели
  `<ellipse cx="50" cy="352" rx="46" ry="6" fill="${GREEN_SHADE}"/>` + spruce(26, 262, 96) + spruce(62, 246, 112) + spruce(88, 280, 78),
  // лошадь
  `<g transform="translate(8,420)"><ellipse cx="50" cy="88" rx="46" ry="5" fill="${GREEN_SHADE}"/><path d="M22 50 L18 86 M32 52 L32 86 M64 52 L66 86 M74 50 L78 86" stroke="#6B3E22" stroke-width="6" stroke-linecap="round"/><ellipse cx="48" cy="44" rx="32" ry="16" fill="#8A5230"/><path d="M70 38 Q80 18 86 8 L98 14 Q96 22 88 24 Q84 36 78 46Z" fill="#8A5230"/><path d="M74 30 Q80 14 88 6" stroke="#3A2412" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M18 40 Q4 44 6 64" stroke="#3A2412" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="90" cy="13" r="1.6" fill="#1A1008"/></g>`,
  // дом с резными ставнями
  `<g transform="translate(280,380)"><ellipse cx="52" cy="116" rx="50" ry="6" fill="${GREEN_SHADE}"/><rect x="8" y="40" width="88" height="74" fill="#F4ECDD"/><path d="M0 44 L52 10 L104 44Z" fill="#4F7FA8"/><rect x="18" y="58" width="24" height="26" fill="#9FD0F0"/><rect x="62" y="58" width="24" height="26" fill="#9FD0F0"/><g fill="#1872B8"><rect x="12" y="56" width="6" height="30"/><rect x="42" y="56" width="6" height="30"/><rect x="56" y="56" width="6" height="30"/><rect x="86" y="56" width="6" height="30"/></g><path d="M16 56 Q30 46 44 56 M60 56 Q74 46 88 56" stroke="#1872B8" stroke-width="3" fill="none"/><rect x="40" y="90" width="22" height="24" fill="#8A5A3B"/></g>`,
  // корзина яблок
  `<g transform="translate(290,520)"><ellipse cx="44" cy="58" rx="42" ry="5" fill="${GREEN_SHADE}"/><g fill="#D8343F"><circle cx="26" cy="26" r="9"/><circle cx="44" cy="22" r="9"/><circle cx="62" cy="26" r="9"/><circle cx="36" cy="16" r="8"/><circle cx="54" cy="14" r="8"/></g><path d="M12 28 L76 28 L68 56 L20 56Z" fill="#C98A5B"/><path d="M16 38 L72 38 M18 47 L70 47" stroke="#A0683E" stroke-width="2"/></g>`,
].join('');

const aksu = [
  '<ellipse cx="60" cy="230" rx="70" ry="30" fill="#E3F2D7"/><ellipse cx="330" cy="430" rx="80" ry="34" fill="#E3F2D7"/><ellipse cx="300" cy="240" rx="60" ry="22" fill="#C9E4B8"/>',
  '<g fill="#F2B33D"><circle cx="150" cy="380" r="4"/><circle cx="252" cy="140" r="4"/><circle cx="40" cy="390" r="3"/></g><g fill="#E86A7A"><circle cx="142" cy="390" r="3.5"/><circle cx="250" cy="520" r="3.5"/></g>',
  // рисовые чеки
  `<g transform="translate(4,20)"><ellipse cx="54" cy="104" rx="54" ry="6" fill="${GREEN_SHADE}"/><path d="M4 30 L104 22 L108 98 L0 102Z" fill="#9FD3C7"/><path d="M54 26 L54 100 M2 64 L106 60" stroke="#B9D9A4" stroke-width="6"/>` +
    grid(12, 34, 4, 2, 11, 12, (x, y) => `<path d="M${x} ${y + 10} L${x} ${y} M${x - 3} ${y + 3} L${x} ${y + 8} M${x + 3} ${y + 3} L${x} ${y + 8}" stroke="#4FA36A" stroke-width="2" stroke-linecap="round"/>`) +
    grid(64, 70, 4, 2, 11, 12, (x, y) => `<path d="M${x} ${y + 10} L${x} ${y} M${x - 3} ${y + 3} L${x} ${y + 8} M${x + 3} ${y + 3} L${x} ${y + 8}" stroke="#4FA36A" stroke-width="2" stroke-linecap="round"/>`) +
    '</g>',
  // ледник Музарт
  `<g transform="translate(250,10)"><ellipse cx="70" cy="110" rx="70" ry="6" fill="${GREEN_SHADE}"/><path d="M0 110 L40 24 L66 58 L96 6 L140 110Z" fill="#CFE6F5"/><path d="M40 24 L52 52 L44 48 L36 58 L30 46Z M96 6 L112 44 L102 38 L92 48 L86 36 L80 40Z" fill="#FFFFFF"/><path d="M66 58 L82 110 M96 40 L110 110" stroke="#9CC6E4" stroke-width="3"/></g>`,
  // грецкий орех
  `<g transform="translate(4,250)"><ellipse cx="50" cy="108" rx="40" ry="5" fill="${GREEN_SHADE}"/><path d="M48 108 L48 64 M48 78 Q36 66 26 60 M48 72 Q60 62 70 56" fill="none" stroke="#7A4E30" stroke-width="7" stroke-linecap="round"/><ellipse cx="48" cy="38" rx="46" ry="32" fill="#3E8E58"/><ellipse cx="30" cy="30" rx="20" ry="16" fill="#4FA36A"/><ellipse cx="66" cy="34" rx="22" ry="16" fill="#4FA36A"/><g fill="#A9C75A"><circle cx="22" cy="42" r="5"/><circle cx="44" cy="22" r="5"/><circle cx="70" cy="44" r="5"/><circle cx="58" cy="54" r="4.5"/></g></g>`,
  // хлопковое поле
  `<g transform="translate(8,430)"><ellipse cx="54" cy="70" rx="54" ry="6" fill="${GREEN_SHADE}"/>` +
    grid(14, 20, 4, 2, 26, 26, (x, y) => `<path d="M${x} ${y + 26} L${x} ${y + 6}" stroke="#6B8E3A" stroke-width="2.5"/><circle cx="${x - 5}" cy="${y + 8}" r="6" fill="#FFFFFF"/><circle cx="${x + 5}" cy="${y + 6}" r="6" fill="#FFFFFF"/><circle cx="${x}" cy="${y}" r="6" fill="#FFFFFF"/><path d="M${x - 9} ${y + 14} L${x + 9} ${y + 14}" stroke="#4FA36A" stroke-width="4" stroke-linecap="round"/>`) +
    '</g>',
  // абрикос
  fruitTree(284, 380, '#F29A3D'),
  // ручей
  '<g transform="translate(262,530)"><path d="M0 20 Q40 4 70 22 Q100 40 130 24 L130 46 Q100 62 70 44 Q40 26 0 42Z" fill="#8CC7E8"/><path d="M14 28 Q34 20 52 30 M80 38 Q98 46 116 36" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".8"/></g>',
].join('');

const urumqi = [
  '<ellipse cx="60" cy="230" rx="70" ry="30" fill="#E3F2D7"/><ellipse cx="330" cy="430" rx="80" ry="34" fill="#E3F2D7"/><ellipse cx="300" cy="240" rx="60" ry="22" fill="#C9E4B8"/>',
  '<g fill="#F2B33D"><circle cx="150" cy="380" r="4"/><circle cx="252" cy="140" r="4"/><circle cx="346" cy="340" r="3"/></g><g fill="#E86A7A"><circle cx="142" cy="390" r="3.5"/><circle cx="250" cy="520" r="3.5"/></g>',
  // Богда
  snowPeaks(0, 6, GREEN_SHADE),
  // башня Большого базара
  `<g transform="translate(286,0)"><ellipse cx="46" cy="150" rx="46" ry="7" fill="${GREEN_SHADE}"/><rect x="6" y="96" width="80" height="52" fill="#D9A877"/><rect x="28" y="22" width="36" height="126" fill="#C98A5B"/><path d="M28 22 Q46 -6 64 22Z" fill="#2B8C7A"/><circle cx="46" cy="4" r="3" fill="#F2B33D"/><rect x="24" y="20" width="44" height="6" fill="#A0683E"/>` +
    [40, 64, 88].map((y) => `<path d="M38 ${y + 16} L38 ${y + 6} Q46 ${y - 4} 54 ${y + 6} L54 ${y + 16}Z" fill="#2B6CB0"/>`).join('') +
    '<path d="M12 148 L12 120 Q20 110 28 120 L28 148Z M64 148 L64 120 Q72 110 80 120 L80 148Z" fill="#2B6CB0"/><path d="M6 96 L86 96" stroke="#A0683E" stroke-width="4"/></g>',
  // озеро Тяньчи
  `<g transform="translate(0,262)"><ellipse cx="56" cy="64" rx="54" ry="26" fill="#6FB6E0"/><ellipse cx="56" cy="62" rx="44" ry="18" fill="#8CC7E8"/><path d="M30 60 Q44 54 58 62 M60 70 Q72 64 86 70" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".8"/></g>` +
    spruce(16, 250, 60) + spruce(100, 262, 52),
  // юрта
  `<g transform="translate(10,430)"><ellipse cx="50" cy="80" rx="50" ry="6" fill="${GREEN_SHADE}"/><path d="M8 78 L8 44 Q50 4 92 44 L92 78Z" fill="#F4ECDD"/><path d="M8 44 Q50 4 92 44 Q50 34 8 44Z" fill="#E2D2B6"/><path d="M8 52 L92 52" stroke="#C8384A" stroke-width="4"/><path d="M40 78 L40 58 L60 58 L60 78Z" fill="#C8384A"/><path d="M44 62 L56 62 M44 68 L56 68" stroke="#F2B33D" stroke-width="2"/></g>`,
  // городские дома
  `<g transform="translate(276,380)"><ellipse cx="56" cy="120" rx="56" ry="6" fill="${GREEN_SHADE}"/><rect x="4" y="40" width="36" height="78" fill="#9FB4C8"/><rect x="44" y="10" width="34" height="108" fill="#7E95A8"/><rect x="82" y="56" width="30" height="62" fill="#B8C7D6"/>` +
    grid(10, 50, 3, 6, 9, 11, (x, y) => `<rect x="${x}" y="${y}" width="5" height="6" fill="#F7E7A1"/>`) +
    grid(50, 20, 3, 9, 9, 11, (x, y) => `<rect x="${x}" y="${y}" width="5" height="6" fill="#F7E7A1"/>`) +
    grid(88, 66, 2, 5, 11, 10, (x, y) => `<rect x="${x}" y="${y}" width="6" height="5" fill="#F7E7A1"/>`) +
    '</g>',
  spruce(330, 520, 70),
].join('');

export const cityScenes: Record<string, CityScene> = {
  Кашгар: { ground: '#D6ECC8', decor: kashgarDecor },
  Турфан: { ground: '#F3E1C6', decor: turpan },
  Хотан: { ground: '#F1E6C9', decor: hotan },
  Кульджа: { ground: '#D6ECC8', decor: ghulja },
  Аксу: { ground: '#D6ECC8', decor: aksu },
  Урумчи: { ground: '#D6ECC8', decor: urumqi },
};

export function sceneFor(city: string): CityScene {
  return cityScenes[city] ?? cityScenes['Кашгар'];
}
