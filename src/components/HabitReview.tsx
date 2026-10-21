import { StarIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import { periodRange } from '../lib/habits';
import {
  dailyMonth, dailyWeek, dailyYear, monthlyYear, shift, weeklyMonth, weeklyYear, type Mark, type Rate,
} from '../lib/review';
import type { Note } from '../lib/types';
import { Dialog } from './Dialog';
import { Icon } from './Icon';

type View = 'week' | 'month' | 'year';

const VIEWS: Record<'day' | 'week' | 'month', View[]> = { day: ['week', 'month', 'year'], week: ['month', 'year'], month: ['year'] };
const VIEW_LABEL: Record<View, string> = { week: 'Semaine', month: 'Mois', year: 'Année' };
const TITLE = { day: 'quotidiennes', week: 'hebdomadaires', month: 'mensuelles' } as const;
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MARK_LABEL: Record<Mark, string> = { ok: 'Tenu', ko: 'Pas tenu', now: 'En cours', future: 'À venir', na: 'Non concerné' };

const fmtDay = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fr-FR', opts);

/**
 * Bilan d'une section des Habitudes (ouvert depuis son en-tête) : grille de la période choisie,
 * taux global et taux par habitude. Quotidiennes : semaine, mois, année ; hebdomadaires : mois,
 * année ; mensuelles : année.
 */
export function HabitReview({ scale, habits, onClose }: { scale: 'day' | 'week' | 'month'; habits: Note[]; onClose: () => void }) {
  const views = VIEWS[scale];
  const [view, setView] = useState<View>(views[0]);
  const today = new Date();
  const [anchor, setAnchor] = useState(today);
  // Pas de période future : la flèche « suivante » s'arrête à la période en cours.
  const atCurrent = periodRange(view, anchor)[0].getTime() === periodRange(view, today)[0].getTime();

  const periodLabel = () => {
    const [from, to] = periodRange(view, anchor);
    if (view === 'week') {
      const sameMonth = from.getMonth() === to.getMonth();
      return `${fmtDay(from, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })} – ${fmtDay(to, { day: 'numeric', month: 'long' })}`;
    }
    if (view === 'month') return fmtDay(from, { month: 'long', year: 'numeric' });
    return String(from.getFullYear());
  };
  const periodWord = { week: 'cette semaine', month: 'ce mois-ci', year: 'cette année' }[view];

  let hero: { big: string; text: string } = { big: '–', text: '' };
  let body: React.ReactNode = null;
  let rateList: Rate[] = [];
  let rateAsCount = false;

  if (scale === 'day' && view === 'week') {
    const r = dailyWeek(habits, anchor, today);
    hero = { big: r.pct === null ? '–' : `${r.pct} %`, text: atCurrent ? `tenu ${periodWord}` : 'tenu cette semaine-là' };
    rateList = r.rates;
    body = (
      <div className="review-grid" style={{ gridTemplateColumns: '112px repeat(7, minmax(0, 1fr))' }}>
        <span />
        {r.days.map((_, i) => <span key={i} className={`review-head ${atCurrent && i === (today.getDay() + 6) % 7 ? 'today' : ''}`}>{DAYS[i]}</span>)}
        {r.rows.map((row) => (
          <Row key={row.name} name={row.name}>
            {row.marks.map((m, i) => <span key={i} className={`dot ${m}`} title={MARK_LABEL[m]} />)}
          </Row>
        ))}
      </div>
    );
  } else if (scale === 'day' && view === 'month') {
    const r = dailyMonth(habits, anchor, today);
    hero = { big: r.pct === null ? '–' : `${r.pct} %`, text: atCurrent ? `tenu ${periodWord}` : 'tenu ce mois-là' };
    rateList = r.rates;
    body = (
      <>
        <div className="review-cal">
          {DAYS.map((d, i) => <span key={`h${i}`} className="review-head">{d}</span>)}
          {Array.from({ length: r.lead }, (_, i) => <span key={`e${i}`} />)}
          {r.days.map((d) => {
            const level = d.share === null ? 'none' : d.share === 0 ? 'l0' : d.share < 0.5 ? 'l1' : d.share < 1 ? 'l2' : 'l3';
            return (
              <span
                key={d.date.getDate()}
                className={`cal-day ${d.future ? 'future' : level} ${d.isToday ? 'today' : ''}`}
                title={d.total ? `${d.done} / ${d.total} tenues` : d.future ? 'À venir' : 'Rien à compter'}
              >
                {d.date.getDate()}
              </span>
            );
          })}
        </div>
        <div className="review-legend">
          <span>Aucune</span>
          <span className="cal-sw l0" /><span className="cal-sw l1" /><span className="cal-sw l2" /><span className="cal-sw l3" />
          <span>Toutes tenues</span>
        </div>
      </>
    );
  } else if (view === 'year' && (scale === 'day' || scale === 'week')) {
    const r = scale === 'day' ? dailyYear(habits, anchor.getFullYear(), today) : weeklyYear(habits, anchor.getFullYear(), today);
    hero = { big: r.pct === null ? '–' : `${r.pct} %`, text: scale === 'day' ? `tenu ${atCurrent ? 'cette année' : 'cette année-là'}` : `des semaines tenues ${atCurrent ? 'cette année' : 'cette année-là'}` };
    rateList = r.rates;
    rateAsCount = scale === 'week';
    body = (
      <>
        <div className="review-bars">
          {r.months.map((m) => (
            <div key={m.month} className="bar-col">
              <span className="bar-val">{m.pct ?? ''}</span>
              <span
                className={`bar ${m.future || m.pct === null ? 'future' : ''} ${m.current ? 'current' : ''}`}
                style={{ height: m.future || m.pct === null ? '100%' : `${Math.max(4, m.pct)}%` }}
                title={m.pct === null ? 'Rien à compter' : `${m.pct} %`}
              />
            </div>
          ))}
        </div>
        <div className="review-months">
          {MONTHS.map((l, i) => <span key={i} className={atCurrent && i === today.getMonth() ? 'today' : ''}>{l}</span>)}
        </div>
      </>
    );
  } else if (scale === 'week' && view === 'month') {
    const r = weeklyMonth(habits, anchor, today);
    hero = { big: `${r.done} / ${r.total}`, text: atCurrent ? 'semaines tenues (hors semaine en cours)' : 'semaines tenues' };
    rateList = r.rates;
    body = (
      <div className="review-grid" style={{ gridTemplateColumns: `112px repeat(${r.weeks.length}, minmax(0, 1fr))` }}>
        <span />
        {r.weeks.map((w, i) => (
          <span key={i} className={`review-head ${w.getTime() === periodRange('week', today)[0].getTime() ? 'today' : ''}`}>
            {w.getDate()}/{w.getMonth() + 1}
          </span>
        ))}
        {r.rows.map((row) => (
          <Row key={row.name} name={row.name}>
            {row.cells.map((c, i) => (
              <span key={i} className="star-cell" title={MARK_LABEL[c.mark]}>
                <Star mark={c.mark} />
                <small>{c.mark === 'future' || c.mark === 'na' ? '' : row.avoid ? (c.mark === 'ok' ? 'tenu' : c.mark === 'ko' ? 'raté' : '…') : `${c.count}/${c.goal}`}</small>
              </span>
            ))}
          </Row>
        ))}
      </div>
    );
  } else {
    const r = monthlyYear(habits, anchor.getFullYear(), today);
    hero = { big: `${r.done} / ${r.total}`, text: atCurrent ? 'mois tenus (hors mois en cours)' : 'mois tenus' };
    body = (
      <div className="review-monthly">
        <div className="review-months">
          {MONTHS.map((l, i) => <span key={i} className={atCurrent && i === today.getMonth() ? 'today' : ''}>{l}</span>)}
        </div>
        {r.rows.map((row) => (
          <div key={row.name} className="monthly-row">
            <div className="monthly-name">
              <span>{row.name}</span>
              <strong>{row.done} / {row.total}</strong>
            </div>
            <div className="review-months">
              {row.cells.map((m, i) => <span key={i} title={MARK_LABEL[m]}><Star mark={m} size={22} /></span>)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Dialog title={`Bilan · ${TITLE[scale]}`} onClose={onClose} className="review">
      {views.length > 1 && (
        <div className="segmented review-tabs" role="radiogroup" aria-label="Période">
          {views.map((v) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} className={view === v ? 'on' : ''} onClick={() => { setView(v); setAnchor(today); }}>
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
      )}
      <div className="review-nav">
        <button type="button" className="icon-btn" aria-label="Période précédente" onClick={() => setAnchor(shift(view, anchor, -1))}>
          <Icon name="back" size={20} />
        </button>
        <span>{periodLabel()}</span>
        <button type="button" className="icon-btn" aria-label="Période suivante" disabled={atCurrent} onClick={() => setAnchor(shift(view, anchor, 1))}>
          <Icon name="next" size={20} />
        </button>
      </div>
      <div className="review-hero">
        <strong>{hero.big}</strong>
        <span>{hero.text}</span>
      </div>
      {habits.length === 0 ? <p className="hint">Aucune habitude dans cette section.</p> : <div className="review-card">{body}</div>}
      {rateList.length > 0 && (
        <>
          <p className="section-label">Par habitude</p>
          <ul className="review-rates">
            {rateList.map((h) => (
              <li key={h.name}>
                <span>{h.name}</span>
                <span className="habit-bar"><span style={{ width: `${h.pct ?? 0}%` }} /></span>
                <strong>{h.pct === null ? '–' : rateAsCount ? `${h.done} / ${h.total}` : `${h.pct} %`}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <>
      <span className="review-name" title={name}>{name}</span>
      {children}
    </>
  );
}

function Star({ mark, size = 26 }: { mark: Mark; size?: number }) {
  return <StarIcon size={size} weight={mark === 'ok' ? 'fill' : 'regular'} className={`star ${mark}`} aria-hidden="true" />;
}
