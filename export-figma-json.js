const { chromium } = require('/home/user/faiz-home-/node_modules/playwright');
const fs = require('fs');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto('file:///home/user/faiz-home-/figma-static.html');
  await p.waitForTimeout(900);

  const doc = await p.evaluate(() => {
    const SX = () => window.scrollX, SY = () => window.scrollY;
    const box = el => { const r = el.getBoundingClientRect();
      return { x: +(r.left + SX()).toFixed(2), y: +(r.top + SY()).toFixed(2),
               width: +r.width.toFixed(2), height: +r.height.toFixed(2) }; };

    const col = s => { const m = s.match(/[\d.]+/g).map(Number);
      return { r: +(m[0]/255).toFixed(4), g: +(m[1]/255).toFixed(4), b: +(m[2]/255).toFixed(4) }; };
    const solid = s => [{ type: 'SOLID', color: col(s) }];

    const STYLE = { 400:'Regular', 500:'Medium', 600:'Semi Bold', 700:'Bold', 800:'Extra Bold', 900:'Black' };

    // a TEXT node from an element. `wrap` = let Figma re-flow the copy.
    function text(el, name, opts = {}) {
      const cs = getComputedStyle(el);
      const b = box(el);
      const fs = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight);
      const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing);
      // inline spans measure to the glyph box; grow them to the line box so
      // Figma places the baseline where the browser does
      if (!opts.wrap) { b.y = +(b.y - (lh - b.height) / 2).toFixed(2); b.height = +lh.toFixed(2); }
      const n = {
        type: 'TEXT', name, ...b,
        characters: opts.characters !== undefined ? opts.characters : el.textContent.trim().replace(/\s+/g, ' '),
        fontName: { family: 'Inter', style: STYLE[cs.fontWeight] || 'Regular' },
        fontSize: +fs.toFixed(2),
        lineHeight: { unit: 'PIXELS', value: +lh.toFixed(2) },
        letterSpacing: { unit: 'PIXELS', value: +ls.toFixed(2) },
        textAlignHorizontal: 'LEFT',
        textAutoResize: opts.wrap ? 'HEIGHT' : 'NONE',
        fills: solid(opts.color || cs.color)
      };
      if (cs.opacity !== '1') n.opacity = +cs.opacity;
      return n;
    }

    function rect(el, name, extra = {}) {
      const cs = getComputedStyle(el);
      return { type: 'RECTANGLE', name, ...box(el),
               fills: solid(extra.fill || cs.backgroundColor),
               cornerRadius: extra.cornerRadius !== undefined ? extra.cornerRadius : parseFloat(cs.borderRadius) || 0,
               ...extra.rest };
    }

    // a run of inline text measured with a Range (for the split "move." word)
    function runBox(node, from, to) {
      const r = document.createRange();
      r.setStart(node, from); r.setEnd(node, to);
      const b = r.getBoundingClientRect();
      return { x: +(b.left + SX()).toFixed(2), y: +(b.top + SY()).toFixed(2),
               width: +b.width.toFixed(2), height: +b.height.toFixed(2) };
    }

    const children = [];

    /* ---------- hero ---------- */
    const card = document.querySelector('.card');
    const cardCS = getComputedStyle(card);
    children.push({
      type: 'RECTANGLE', name: 'Hero block', ...box(card),
      fills: [{ type: 'SOLID', color: col('rgb(255,255,255)') }],
      cornerRadius: 2,
      effects: [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 },
                  offset: { x: 0, y: 30 }, radius: 80, spread: 0, visible: true, blendMode: 'NORMAL' }]
    });

    const heroWords = [];
    document.querySelectorAll('.card .line').forEach((line, li) => {
      line.querySelectorAll(':scope > .w').forEach(w => {
        const badge = w.querySelector('.badge');
        if (badge) {
          const bcs = getComputedStyle(badge);
          const bb = box(badge);
          heroWords.push({ type: 'RECTANGLE', name: 'Badge / fill', ...bb,
                           fills: solid(bcs.backgroundColor), cornerRadius: bb.height / 2 });
          heroWords.push({ type: 'RECTANGLE', name: 'Badge / outline',
                           x: +(bb.x - 6).toFixed(2), y: +(bb.y - 5).toFixed(2),
                           width: +(bb.width + 13).toFixed(2), height: +(bb.height + 9).toFixed(2),
                           fills: [], strokes: solid('rgb(255,77,23)'), strokeWeight: 2,
                           cornerRadius: (bb.height + 9) / 2, rotation: 1.1 });
          heroWords.push(text(badge, 'Badge / label'));
          return;
        }
        if (w.classList.contains('move')) {
          const kids = w.childNodes;
          const mBox = runBox(kids[0], 0, 1);                       // "m"
          const oStart = box(w.querySelector('.move__o'));
          const oEnd = box(w.querySelector('.move__stretch'));
          const tail = kids[kids.length - 1];
          const vBox = runBox(tail, 0, tail.textContent.length);    // "ve."
          const cs = getComputedStyle(w);
          const base = { fontName: { family: 'Inter', style: 'Extra Bold' },
                         fontSize: +parseFloat(cs.fontSize).toFixed(2),
                         lineHeight: { unit: 'PIXELS', value: +parseFloat(cs.lineHeight).toFixed(2) },
                         letterSpacing: { unit: 'PIXELS', value: +parseFloat(cs.letterSpacing).toFixed(2) },
                         textAlignHorizontal: 'LEFT', textAutoResize: 'NONE' };
          const lh = base.lineHeight.value;
          const fix = b => ({ x: b.x, y: +(b.y - (lh - b.height) / 2).toFixed(2), width: b.width, height: +lh.toFixed(2) });
          heroWords.push({ type: 'TEXT', name: 'move / m', ...fix(mBox), characters: 'm', ...base, fills: solid('rgb(11,11,11)') });
          heroWords.push({ type: 'TEXT', name: 'move / ooo', ...fix({ x: oStart.x, y: oStart.y,
                            width: +(oEnd.x + oEnd.width - oStart.x).toFixed(2), height: oStart.height }),
                            characters: 'o'.repeat(13), ...base, fills: solid('rgb(43,127,255)'),
                            effects: [{ type: 'DROP_SHADOW', color: { r: 0.169, g: 0.498, b: 1, a: 0.55 },
                                        offset: { x: 0, y: 0 }, radius: 22, spread: 0, visible: true, blendMode: 'NORMAL' }] });
          heroWords.push({ type: 'TEXT', name: 'move / ve.', ...fix(vBox), characters: 've.', ...base, fills: solid('rgb(11,11,11)') });
          return;
        }
        heroWords.push(text(w, 'Word / ' + w.textContent.trim()));
      });
    });
    children.push({ type: 'GROUP', name: 'Hero copy', ...box(card), children: heroWords });

    /* ---------- info panels ---------- */
    document.querySelectorAll('.panel').forEach(panel => {
      const label = panel.querySelector('.panel__label').textContent.trim();
      const kids = [];

      kids.push({ type: 'RECTANGLE', name: 'Panel / fill', ...box(panel),
                  fills: [{ type: 'SOLID', color: col('rgb(255,255,255)') }], cornerRadius: 2 });
      kids.push(text(panel.querySelector('.panel__label'), 'Label', { wrap: true }));

      panel.querySelectorAll('.tools > .tool').forEach(tool => {
        const tb = box(tool);
        const mono = tool.querySelector('span');
        if (mono) {
          kids.push({ type: 'RECTANGLE', name: 'Tool / ' + tool.title + ' / tile', ...tb,
                      fills: solid(getComputedStyle(tool).backgroundColor), cornerRadius: +(tb.width * 0.22).toFixed(2) });
          kids.push(text(mono, 'Tool / ' + tool.title + ' / mark'));
        } else if (tool.classList.contains('tool--ms')) {
          const s = tb.width * 0.64, o = (tb.width - s) / 2, u = s * 10 / 22, g = s * 2 / 22;
          [['#f25022', 0, 0], ['#7fba00', 1, 0], ['#00a4ef', 0, 1], ['#ffb900', 1, 1]].forEach(([hex, cx, cy], i) => {
            kids.push({ type: 'RECTANGLE', name: 'Tool / Microsoft / sq' + (i + 1),
                        x: +(tb.x + o + cx * (u + g)).toFixed(2), y: +(tb.y + o + cy * (u + g)).toFixed(2),
                        width: +u.toFixed(2), height: +u.toFixed(2),
                        fills: [{ type: 'SOLID', color: col('rgb(' + [1, 3, 5].map(k => parseInt(hex.substr(k, 2), 16)).join(',') + ')') }],
                        cornerRadius: 0 });
          });
        } else {
          // Figma mark: four half-pills + one circle, built from the same
          // 38 x 57 grid as the SVG
          const h = tb.height * 0.78, w = h * 38 / 57, x0 = tb.x + (tb.width - w) / 2, y0 = tb.y + (tb.height - h) / 2;
          const u = w / 2, R = u / 2;
          const pill = (name, hex, cx, cy, dir) => {
            kids.push({ type: 'ELLIPSE', name: name + ' / cap',
                        x: +(x0 + cx * u).toFixed(2), y: +(y0 + cy * u).toFixed(2),
                        width: +u.toFixed(2), height: +u.toFixed(2),
                        fills: [{ type: 'SOLID', color: col('rgb(' + [1, 3, 5].map(k => parseInt(hex.substr(k, 2), 16)).join(',') + ')') }] });
            kids.push({ type: 'RECTANGLE', name: name + ' / body',
                        x: +(x0 + (cx + (dir > 0 ? 0.5 : 0)) * u).toFixed(2), y: +(y0 + cy * u).toFixed(2),
                        width: +(u / 2).toFixed(2), height: +u.toFixed(2),
                        fills: [{ type: 'SOLID', color: col('rgb(' + [1, 3, 5].map(k => parseInt(hex.substr(k, 2), 16)).join(',') + ')') }],
                        cornerRadius: 0 });
          };
          pill('Figma / orange', '#f24e1e', 0, 0, 1);
          pill('Figma / salmon', '#ff7262', 1, 0, -1);
          pill('Figma / purple', '#a259ff', 0, 1, 1);
          kids.push({ type: 'ELLIPSE', name: 'Figma / blue',
                      x: +(x0 + u).toFixed(2), y: +(y0 + u).toFixed(2), width: +u.toFixed(2), height: +u.toFixed(2),
                      fills: [{ type: 'SOLID', color: col('rgb(26,188,254)') }] });
          pill('Figma / green', '#0acf83', 0, 2, 1);
        }
      });

      panel.querySelectorAll('.flow > span').forEach(step => {
        const arrow = step.querySelector('i');
        const word = step.firstChild.textContent.trim();
        kids.push(text(step, 'Step / ' + word, { characters: word }));
        if (arrow) kids.push(text(arrow, 'Step / arrow', { characters: '→' }));
      });

      const years = panel.querySelector('.years__num');
      if (years) kids.push(text(years, 'Years'));
      panel.querySelectorAll('.orgs li').forEach(li => kids.push(text(li, 'Company / ' + li.textContent.trim())));

      const langs = panel.querySelector('.langs');
      if (langs) kids.push(text(langs, 'Languages', { wrap: true }));

      kids.push(text(panel.querySelector('.note'), 'Note', { wrap: true }));

      children.push({ type: 'GROUP', name: 'Panel / ' + label, ...box(panel), children: kids });
    });

    return {
      name: 'Shibili Nuhman — home',
      type: 'FRAME',
      x: 0, y: 0, width: 1440, height: document.documentElement.scrollHeight,
      fills: [{ type: 'SOLID', color: col(getComputedStyle(document.body).backgroundColor) }],
      children
    };
  });

  fs.writeFileSync('/home/user/faiz-home-/design.json', JSON.stringify(doc, null, 2));
  console.log('frame', doc.width + 'x' + doc.height, '| top-level', doc.children.length,
              '| nodes', JSON.stringify(doc).match(/"type":/g).length);
  await b.close();
})();
